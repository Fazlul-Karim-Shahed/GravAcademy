import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Examination, Question, ExamAttempt } from '../models/Examination';
import { Enrollment } from '../models/Enrollment';
import { Batch } from '../models/Batch';
import { ROLES, PERMISSIONS, hasUserPermission } from '../types/roles';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { hasActiveStudentBatchAccess } from '../services/batchAccessService';
import { classroomLink, dispatchNotification, notifyExamPublished, notifyStudent } from '../services/classroomNotificationService';
import { formatBulkMcqWithGemini } from '../services/geminiService';

const hasExplicitPermission = (user: any, permission: string) =>
  (user?.customPermissions || []).includes(permission) && !(user?.revokedPermissions || []).includes(permission);

async function canAccessExamBatch(user: any, batchId: string, permissions: string[] = [PERMISSIONS.EXAMS_MANAGE, PERMISSIONS.EXAMS_EVALUATE]) {
  if (!user) return false;
  if ([ROLES.SUPERADMIN, ROLES.ADMIN].includes(user.role)) return true;

  if (user.role === ROLES.EMPLOYEE) {
    return permissions.some((permission) => hasUserPermission(user, permission as any));
  }

  if (user.role !== ROLES.TEACHER) return false;

  // A permission added explicitly by an admin is intentionally platform-wide.
  if (permissions.some((permission) => hasExplicitPermission(user, permission))) return true;

  // Default teacher permissions are limited to batches assigned to that teacher.
  const batch = await Batch.findById(batchId).select('assignedTeachers courseId').lean();
  if (!batch) return false;
  if ((batch.assignedTeachers || []).some((teacherId: any) => teacherId.toString() === user._id.toString())) return true;
  const course = await Course.findById(batch.courseId).select('instructors').lean();
  return (course?.instructors || []).some((teacherId: any) => teacherId.toString() === user._id.toString());
}

export const formatBulkQuestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text || text.length > 100000) return res.status(400).json({ success: false, message: 'Question text is required.' });
    return res.json({ success: true, data: { questions: await formatBulkMcqWithGemini(text) } });
  } catch (error) {
    return res.status(503).json({ success: false, message: error instanceof Error ? error.message : 'AI formatting failed.' });
  }
};

// Schema for Question Option
const optionSchema = z.object({
  optionId: z.string().min(1),
  text: z.string().min(1),
  imageUrl: z.string().optional(),
});

// Schema for MCQ Question
const mcqQuestionSchema = z.object({
  questionText: z.string().min(1),
  imageUrl: z.string().optional(),
  options: z.array(optionSchema).min(2),
  correctOptionId: z.string().min(1),
  explanation: z.string().optional(),
  marks: z.number().min(0.5).default(1),
  order: z.number().default(0),
});

// Schema for CQ Question
const cqQuestionSchema = z.object({
  questionText: z.string().min(1),
  marks: z.number().min(1).default(10),
});

// Update Examination Schema
export const updateExamSchema = z.object({
  title: z.string().min(3).optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().min(1).optional(),
  totalMarks: z.number().min(1).optional(),
  passMarks: z.number().min(0).optional(),
  negativeMarkPerWrong: z.number().min(0).optional(),
  startWindow: z.string().datetime().optional(),
  endWindow: z.string().datetime().optional(),
  attemptLimit: z.number().min(1).optional(),
  randomizeQuestions: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  examType: z.enum(['upload_paper', 'system_questions']).optional(),
  questionMode: z.enum(['mcq', 'cq', 'both']).optional(),
  questionPaperUrl: z.string().optional(),
  mcqQuestions: z.array(mcqQuestionSchema).optional(),
  cqQuestions: z.array(cqQuestionSchema).optional(),
}).refine(
  (data) => data.passMarks === undefined || data.totalMarks === undefined || data.passMarks <= data.totalMarks,
  { message: 'পাস মার্ক মোট নম্বরের চেয়ে বেশি হতে পারবে না', path: ['passMarks'] }
);

/**
 * Recalculate stored MCQ marks when a teacher changes the answer key.
 * Question documents are replaced during an exam edit, so answers are
 * matched by the question order before their questionId is migrated.
 */
const regradeExamAttempts = async (
  exam: any,
  currentQuestions: any[],
  previousQuestions: any[] = []
) => {
  const oldById = new Map(previousQuestions.map((question) => [question._id.toString(), question]));
  const currentById = new Map(currentQuestions.map((question) => [question._id.toString(), question]));
  const currentByOrder = new Map(currentQuestions.map((question) => [question.order, question]));
  const attempts = await ExamAttempt.find({ examId: exam._id });

  for (const attempt of attempts) {
    let mcqScore = 0;
    const answers = (attempt.answers || []).map((answer: any, answerIndex: number) => {
      const oldQuestion = oldById.get(answer.questionId?.toString());
      const question = oldQuestion
        ? currentByOrder.get(oldQuestion.order)
        : currentById.get(answer.questionId?.toString()) || currentQuestions[answerIndex];

      if (!question || !answer.selectedOptionId) return answer;

      const isCorrect = String(answer.selectedOptionId) === String(question.correctOptionId);
      const marksAwarded = isCorrect ? question.marks : -(exam.negativeMarkPerWrong || 0);
      mcqScore += marksAwarded;

      return {
        ...(typeof answer.toObject === 'function' ? answer.toObject() : answer),
        questionId: question._id,
        isCorrect,
        marksAwarded,
      };
    });

    mcqScore = Math.max(0, mcqScore);
    const totalScore = mcqScore + (attempt.cqScore || 0);
    attempt.answers = answers as any;
    attempt.mcqScore = mcqScore;
    attempt.totalScore = totalScore;
    attempt.passed = attempt.isEvaluated ? totalScore >= exam.passMarks : false;
    await attempt.save();
  }
};

/**
 * Update an existing examination and its questions (Teacher / Admin)
 * Can be edited even after publishing or during live exam!
 * Automatically increments questionsVersion to notify online students.
 */
export const updateExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const body = updateExamSchema.parse(req.body);

    const exam = await Examination.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'এক্সাম পাওয়া যায়নি' });
    }
    if (!await canAccessExamBatch(req.user, exam.batchId.toString(), [PERMISSIONS.EXAMS_MANAGE])) {
      return res.status(403).json({ success: false, message: 'এই ব্যাচের পরীক্ষা পরিবর্তনের অনুমতি নেই' });
    }
    const wasPublished = exam.isPublished;

    if (body.title !== undefined) exam.title = body.title.trim();
    if (body.instructions !== undefined) exam.instructions = body.instructions.trim();
    if (body.durationMinutes !== undefined) exam.durationMinutes = body.durationMinutes;
    if (body.totalMarks !== undefined) exam.totalMarks = body.totalMarks;
    if (body.passMarks !== undefined) exam.passMarks = body.passMarks;
    if (body.negativeMarkPerWrong !== undefined) exam.negativeMarkPerWrong = body.negativeMarkPerWrong;
    if (body.startWindow !== undefined) exam.startWindow = new Date(body.startWindow);
    if (body.endWindow !== undefined) exam.endWindow = new Date(body.endWindow);
    if (body.attemptLimit !== undefined) exam.attemptLimit = body.attemptLimit;
    if (body.randomizeQuestions !== undefined) exam.randomizeQuestions = body.randomizeQuestions;
    if (body.isPublished !== undefined) exam.isPublished = body.isPublished;
    if (body.examType !== undefined) exam.examType = body.examType;
    if (body.questionMode !== undefined) exam.questionMode = body.questionMode;
    if (body.questionPaperUrl !== undefined) exam.questionPaperUrl = body.questionPaperUrl;
    if (body.cqQuestions !== undefined) exam.cqQuestions = body.cqQuestions;

    // Increment questions version for real-time client sync
    exam.questionsVersion = (exam.questionsVersion || 1) + 1;
    await exam.save();

    // Keep the old order before replacing questions so existing attempts can
    // be migrated to the new question IDs during answer-key regrading.
    const previousQuestions = body.mcqQuestions !== undefined
      ? await Question.find({ examId: exam._id }).select('+correctOptionId').sort({ order: 1 })
      : [];

    // If mcqQuestions is provided, replace/update Question documents
    if (body.mcqQuestions !== undefined) {
      await Question.deleteMany({ examId: exam._id });

      if (body.mcqQuestions.length > 0) {
        const questionDocs = body.mcqQuestions.map((q, idx) => ({
          examId: exam._id,
          questionText: q.questionText,
          imageUrl: q.imageUrl || '',
          options: q.options.map(opt => ({
            optionId: opt.optionId,
            text: opt.text,
            imageUrl: opt.imageUrl || '',
          })),
          correctOptionId: q.correctOptionId,
          explanation: q.explanation || '',
          marks: q.marks,
          order: q.order ?? idx,
        }));

        await Question.insertMany(questionDocs);
      }
    }

    const updatedQuestions = await Question.find({ examId: exam._id })
      .select('+correctOptionId')
      .sort({ order: 1 });

    if (body.mcqQuestions !== undefined || body.negativeMarkPerWrong !== undefined) {
      await regradeExamAttempts(exam, updatedQuestions, previousQuestions);
    }

    if (!wasPublished && exam.isPublished) dispatchNotification(notifyExamPublished(exam));

    return res.status(200).json({
      success: true,
      message: 'এক্সাম ও প্রশ্নপত্র সফলভাবে আপডেট করা হয়েছে',
      data: {
        exam,
        questions: updatedQuestions,
      },
    });
  } catch (error: any) {
    console.error('Error updating exam:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0]?.message || 'Invalid exam data' });
    }
    return res.status(500).json({ success: false, message: error?.message || 'Failed to update exam' });
  }
};

// Create Examination Schema
export const createExamSchema = z.object({
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  title: z.string().min(3),
  instructions: z.string().optional(),
  durationMinutes: z.number().min(1),
  totalMarks: z.number().min(1),
  passMarks: z.number().min(0),
  negativeMarkPerWrong: z.number().min(0).default(0),
  startWindow: z.string().datetime(),
  endWindow: z.string().datetime(),
  attemptLimit: z.number().min(1).default(1),
  randomizeQuestions: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  examType: z.enum(['upload_paper', 'system_questions']).default('system_questions'),
  questionMode: z.enum(['mcq', 'cq', 'both']).default('mcq'),
  questionPaperUrl: z.string().optional(),
  mcqQuestions: z.array(mcqQuestionSchema).optional(),
  cqQuestions: z.array(cqQuestionSchema).optional(),
}).refine(
  (data) => data.passMarks <= data.totalMarks,
  { message: 'পাস মার্ক মোট নম্বরের চেয়ে বেশি হতে পারবে না', path: ['passMarks'] }
);

/**
 * Create a new examination (Teacher / Admin)
 */
export const createExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const body = createExamSchema.parse(req.body);

    if (!await canAccessExamBatch(user, body.batchId, [PERMISSIONS.EXAMS_MANAGE])) {
      return res.status(403).json({ success: false, message: 'এই ব্যাচে পরীক্ষা তৈরির অনুমতি নেই' });
    }

    const exam = await Examination.create({
      batchId: body.batchId,
      title: body.title,
      instructions: body.instructions || '',
      durationMinutes: body.durationMinutes,
      totalMarks: body.totalMarks,
      passMarks: body.passMarks,
      negativeMarkPerWrong: body.negativeMarkPerWrong,
      startWindow: new Date(body.startWindow),
      endWindow: new Date(body.endWindow),
      attemptLimit: body.attemptLimit,
      randomizeQuestions: body.randomizeQuestions,
      isPublished: body.isPublished,
      examType: body.examType,
      questionMode: body.questionMode,
      questionPaperUrl: body.questionPaperUrl || '',
      cqQuestions: body.cqQuestions || [],
      createdBy: user?._id,
    });

    // If system_questions with MCQ, create Question documents
    if (
      body.examType === 'system_questions' &&
      (body.questionMode === 'mcq' || body.questionMode === 'both') &&
      body.mcqQuestions &&
      body.mcqQuestions.length > 0
    ) {
      const questionDocs = body.mcqQuestions.map((q, idx) => ({
        examId: exam._id,
        questionText: q.questionText,
        imageUrl: q.imageUrl || '',
        options: q.options.map(opt => ({
          optionId: opt.optionId,
          text: opt.text,
          imageUrl: opt.imageUrl || '',
        })),
        correctOptionId: q.correctOptionId,
        explanation: q.explanation || '',
        marks: q.marks,
        order: q.order ?? idx,
      }));

      await Question.insertMany(questionDocs);
    }

    if (exam.isPublished) dispatchNotification(notifyExamPublished(exam));

    return res.status(201).json({
      success: true,
      message: 'এক্সাম সফলভাবে তৈরি করা হয়েছে',
      data: exam,
    });
  } catch (error: any) {
    console.error('Error creating exam:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0]?.message || 'Invalid exam data' });
    }
    return res.status(500).json({ success: false, message: error?.message || 'Failed to create exam' });
  }
};

/**
 * List examinations for a batch
 */
export const getBatchExams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const user = req.user;

    if (user?.role === ROLES.STUDENT) {
      const [enrollment, batch] = await Promise.all([
        Enrollment.findOne({ gravId: user.gravId, batchId, status: { $in: ['enrolled', 'completed'] } }),
        Batch.findById(batchId),
      ]);
      const courseAccess = batch ? await Course.findById(batch.courseId).select('studentAccessMode studentAccessMonths') : null;
      if (!enrollment || !batch || !courseAccess || !hasActiveStudentBatchAccess(batch, enrollment, courseAccess)) {
        return res.status(403).json({ success: false, message: 'এই batch-এর access period শেষ হয়েছে।' });
      }
    } else if (!await canAccessExamBatch(user, batchId)) {
      return res.status(403).json({ success: false, message: 'এই ব্যাচের পরীক্ষা দেখার অনুমতি নেই' });
    }

    const exams = await Examination.find({
      batchId,
      ...(user?.role === ROLES.STUDENT ? { isPublished: true } : {}),
    }).sort({ startWindow: 1 });

    // If user is a student, check their submission status for each exam
    let userAttemptsMap: Record<string, any> = {};
    if (user && user.role === ROLES.STUDENT) {
      const attempts = await ExamAttempt.find({
        batchId,
        gravId: user.gravId,
      });
      attempts.forEach((att) => {
        userAttemptsMap[att.examId.toString()] = att;
      });
    }

    const enhancedExams = exams.map((exam) => {
      const examObj = exam.toObject();
      const attempt = userAttemptsMap[exam._id.toString()];
      return {
        ...examObj,
        myAttempt: attempt
          ? {
              _id: attempt._id,
              status: attempt.status,
              totalScore: attempt.totalScore,
              mcqScore: attempt.mcqScore,
              cqScore: attempt.cqScore,
              passed: attempt.passed,
              isEvaluated: attempt.isEvaluated,
              submittedAt: attempt.submittedAt,
            }
          : null,
      };
    });

    return res.status(200).json({ success: true, count: exams.length, data: enhancedExams });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
};

/**
 * Get detailed exam info
 */
export const getExamDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const exam = await Examination.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'এক্সাম পাওয়া যায়নি' });
    }
    if (!await canAccessExamBatch(req.user, exam.batchId.toString(), [PERMISSIONS.EXAMS_MANAGE])) {
      return res.status(403).json({ success: false, message: 'এই পরীক্ষাটি দেখার অনুমতি নেই' });
    }

    // Also fetch questions if teacher/admin wants to edit/view
    const questions = await Question.find({ examId })
      .select('+correctOptionId')
      .sort({ order: 1 });

    return res.status(200).json({
      success: true,
      data: {
        exam,
        questions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exam details' });
  }
};

/**
 * Get exam questions for student taking the exam
 * SECURITY: correctOptionId and explanation are NEVER returned to student
 */
export const getStudentExamQuestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const user = req.user;

    const exam = await Examination.findById(examId);
    if (!exam || !exam.isPublished) {
      return res.status(404).json({ success: false, message: 'Exam not found or unpublished' });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      gravId: user?.gravId,
      batchId: exam.batchId,
      status: { $in: ['enrolled', 'completed'] },
    });
    const batch = await Batch.findById(exam.batchId);
    const courseAccess = batch ? await Course.findById(batch.courseId).select('studentAccessMode studentAccessMonths') : null;
    const isEnrolled = !!enrollment && !!batch && !!courseAccess && hasActiveStudentBatchAccess(batch, enrollment, courseAccess);

    const isTeacherOrAdmin = await canAccessExamBatch(user, exam.batchId.toString());

    if (!isEnrolled && !isTeacherOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this batch' });
    }

    // Check scheduled time window: If current time is before startWindow, students cannot access questions
    const now = new Date();
    if (!isTeacherOrAdmin && now < new Date(exam.startWindow)) {
      return res.status(403).json({
        success: false,
        message: 'এক্সামটি এখনও শুরু হয়নি। নির্ধারিত সময়ে প্রবেশ করুন।',
        startWindow: exam.startWindow,
      });
    }

    // Check if student already submitted and reached attempt limit
    if (!isTeacherOrAdmin) {
      const existingAttempts = await ExamAttempt.countDocuments({
        examId: exam._id,
        gravId: user?.gravId,
        status: { $in: ['submitted', 'evaluated', 'timeout'] },
      });

      if (existingAttempts >= (exam.attemptLimit || 1)) {
        return res.status(400).json({
          success: false,
          message: 'আপনি ইতিমধ্যে এই পরীক্ষায় অংশ নিয়েছেন।',
          alreadySubmitted: true,
        });
      }
    }

    let attemptStartedAt: Date | undefined;
    let attemptExpiresAt: Date | undefined;
    if (!isTeacherOrAdmin) {
      if (now > new Date(exam.endWindow)) {
        return res.status(403).json({ success: false, message: 'পরীক্ষার সময়সীমা শেষ হয়ে গেছে।' });
      }
      let activeAttempt = await ExamAttempt.findOne({ examId: exam._id, gravId: user!.gravId, status: 'in_progress' }).sort({ startedAt: -1 });
      if (!activeAttempt) {
        activeAttempt = await ExamAttempt.create({ gravId: user!.gravId, examId: exam._id, batchId: exam.batchId, status: 'in_progress' });
      }
      attemptStartedAt = activeAttempt.startedAt;
      const durationEndsAt = new Date(attemptStartedAt.getTime() + exam.durationMinutes * 60 * 1000);
      attemptExpiresAt = durationEndsAt < new Date(exam.endWindow) ? durationEndsAt : new Date(exam.endWindow);
      if (now > attemptExpiresAt) {
        activeAttempt.status = 'timeout';
        await activeAttempt.save();
        return res.status(403).json({ success: false, message: 'আপনার নির্ধারিত পরীক্ষার সময় শেষ হয়ে গেছে।' });
      }
    }

    // Fetch MCQ questions without correct answers
    const questions = await Question.find({ examId })
      .select('questionText imageUrl options marks order')
      .sort({ order: 1 });

    return res.status(200).json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          batchId: exam.batchId,
          title: exam.title,
          instructions: exam.instructions,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          passMarks: exam.passMarks,
          negativeMarkPerWrong: exam.negativeMarkPerWrong,
          startWindow: exam.startWindow,
          endWindow: exam.endWindow,
          examType: exam.examType,
          questionMode: exam.questionMode,
          questionPaperUrl: exam.questionPaperUrl,
          cqQuestions: exam.cqQuestions,
          questionsVersion: exam.questionsVersion || 1,
          attemptStartedAt,
          attemptExpiresAt,
        },
        mcqQuestions: questions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exam questions' });
  }
};

/**
 * Submit Exam & Server-side Auto Grading for MCQ, Record CQ/Documents
 */
export const submitExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const { answers = [], cqAnswers = [], studentDocumentUrl = '' } = req.body;
    const user = req.user;

    const exam = await Examination.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (!user || user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only enrolled students can submit an exam attempt.' });
    }

    const isTeacherOrAdmin = false;

    if (!isTeacherOrAdmin) {
      if (!exam.isPublished) {
        return res.status(404).json({ success: false, message: 'Exam not found or unpublished' });
      }

      const enrollment = await Enrollment.findOne({
        gravId: user?.gravId,
        batchId: exam.batchId,
        status: { $in: ['enrolled', 'completed'] },
      });
      const batch = await Batch.findById(exam.batchId);
      const courseAccess = batch ? await Course.findById(batch.courseId).select('studentAccessMode studentAccessMonths') : null;
      if (!enrollment || !batch || !courseAccess || !hasActiveStudentBatchAccess(batch, enrollment, courseAccess)) {
        return res.status(403).json({ success: false, message: 'Not enrolled in this batch' });
      }

      const now = new Date();
      if (now < new Date(exam.startWindow)) {
        return res.status(403).json({
          success: false,
          message: 'এক্সামটি এখনও শুরু হয়নি। নির্ধারিত সময়ে প্রবেশ করুন।',
        });
      }
      if (now > new Date(exam.endWindow)) {
        return res.status(403).json({
          success: false,
          message: 'এক্সামের সময়সীমা শেষ হয়ে গেছে।',
        });
      }

      const existingAttempts = await ExamAttempt.countDocuments({
        examId: exam._id,
        gravId: user?.gravId,
        status: { $in: ['submitted', 'evaluated', 'timeout'] },
      });
      if (existingAttempts >= (exam.attemptLimit || 1)) {
        return res.status(400).json({
          success: false,
          message: 'আপনি ইতিমধ্যে এই পরীক্ষায় অংশ নিয়েছেন।',
          alreadySubmitted: true,
        });
      }
    }

    const activeAttempt = await ExamAttempt.findOne({ examId: exam._id, gravId: user.gravId, status: 'in_progress' }).sort({ startedAt: -1 });
    if (!activeAttempt) {
      return res.status(400).json({ success: false, message: 'No active exam attempt was found. Please reload the exam page.' });
    }
    const attemptDeadline = new Date(Math.min(activeAttempt.startedAt.getTime() + exam.durationMinutes * 60 * 1000, new Date(exam.endWindow).getTime()));
    if (new Date() > attemptDeadline) {
      activeAttempt.status = 'timeout';
      await activeAttempt.save();
      return res.status(403).json({ success: false, message: 'আপনার নির্ধারিত পরীক্ষার সময় শেষ হয়ে গেছে।' });
    }

    // Fetch questions WITH correctOptionId for server-side grading
    const questions = await Question.find({ examId }).select('+correctOptionId');

    let mcqScore = 0;
    const evaluatedAnswers = [];

    for (const q of questions) {
      const studentAns = answers.find(
        (a: any) => a.questionId?.toString() === q._id?.toString()
      );

      if (studentAns && studentAns.selectedOptionId) {
        const isCorrect = studentAns.selectedOptionId === q.correctOptionId;
        let marksAwarded = 0;

        if (isCorrect) {
          marksAwarded = q.marks;
        } else if (exam.negativeMarkPerWrong > 0) {
          marksAwarded = -exam.negativeMarkPerWrong;
        }

        mcqScore += marksAwarded;
        evaluatedAnswers.push({
          questionId: q._id,
          selectedOptionId: studentAns.selectedOptionId,
          isCorrect,
          marksAwarded,
        });
      }
    }

    if (mcqScore < 0) mcqScore = 0;

    // Check if exam has CQ or Paper upload that needs manual evaluation
    const hasManualGrading =
      exam.examType === 'upload_paper' ||
      exam.questionMode === 'cq' ||
      exam.questionMode === 'both';

    const isAutoEvaluated = !hasManualGrading;
    const totalScore = mcqScore;
    const passed = isAutoEvaluated ? totalScore >= exam.passMarks : false;

    const attempt = activeAttempt;
    attempt.submittedAt = new Date();
    attempt.answers = evaluatedAnswers;
    attempt.cqAnswers = cqAnswers || [];
    attempt.studentDocumentUrl = studentDocumentUrl || '';
    attempt.mcqScore = mcqScore;
    attempt.cqScore = 0;
    attempt.totalScore = totalScore;
    attempt.passed = passed;
    attempt.isEvaluated = isAutoEvaluated;
    attempt.status = isAutoEvaluated ? 'evaluated' : 'submitted';
    await attempt.save();

    if (isAutoEvaluated) dispatchNotification(notifyStudent(user!.gravId, `পরীক্ষার ফল: ${exam.title}`,
      `"${exam.title}" পরীক্ষার ফল প্রস্তুত।\n${classroomLink(exam.batchId.toString(), `/exams/${exam._id}/result`)}`));

    return res.status(200).json({
      success: true,
      message: isAutoEvaluated
        ? 'পরীক্ষা জমা ও মূল্যায়ন সম্পন্ন হয়েছে'
        : 'পরীক্ষা সফলভাবে জমা দেওয়া হয়েছে! শিক্ষক মূল্যায়ন করার পর চূড়ান্ত ফলাফল দেখতে পাবেন।',
      data: {
        attemptId: attempt._id,
        mcqScore,
        totalScore,
        isEvaluated: isAutoEvaluated,
        passed,
        passMarks: exam.passMarks,
        totalMarks: exam.totalMarks,
      },
    });
  } catch (error) {
    console.error('Exam submission error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit exam' });
  }
};

/**
 * Get all student submissions for an exam (Teacher / Admin)
 */
export const getExamSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;

    const exam = await Examination.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (!await canAccessExamBatch(req.user, exam.batchId.toString())) {
      return res.status(403).json({ success: false, message: 'এই ব্যাচের সাবমিশন দেখার অনুমতি নেই' });
    }

    const attempts = await ExamAttempt.find({
      examId,
      status: { $in: ['submitted', 'evaluated', 'timeout'] },
    })
      .sort({ submittedAt: -1 });
    const attemptGravIds = attempts.map((attempt) => attempt.gravId).filter(Boolean);
    const students = await User.find({ gravId: { $in: attemptGravIds }, role: ROLES.STUDENT })
      .select('name email phone avatarUrl gravId')
      .lean();
    const studentMap = new Map(students.map((student) => [student.gravId, student]));
    const enrichedAttempts = attempts.map((attempt) => ({
      ...attempt.toObject(),
      gravId: studentMap.get(attempt.gravId) || { gravId: attempt.gravId },
    }));

    return res.status(200).json({
      success: true,
      exam,
      count: attempts.length,
      data: enrichedAttempts,
    });
  } catch (error) {
    console.error('getExamSubmissions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
};

/**
 * Evaluate student attempt manually (Teacher / Admin)
 */
export const evaluateStudentAttempt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const {
      cqScore = 0,
      teacherFeedback = '',
      annotatedFileUrl,
      annotatedFileName = '',
    } = req.body;
    const user = req.user;

    const attempt = await ExamAttempt.findById(attemptId).populate('examId');
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'সাবমিশন পাওয়া যায়নি' });
    }

    const exam: any = attempt.examId;
    if (!exam || !await canAccessExamBatch(user, exam.batchId.toString())) {
      return res.status(403).json({ success: false, message: 'এই পরীক্ষাটি মূল্যায়নের অনুমতি নেই' });
    }

    const cqMaxMarks = Array.isArray(exam?.cqQuestions) && exam.cqQuestions.length > 0
      ? exam.cqQuestions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 0), 0)
      : Math.max(0, (exam?.totalMarks || 0) - (attempt.mcqScore || 0));

    let parsedCQScore = Number(cqScore);
    if (!Number.isFinite(parsedCQScore)) parsedCQScore = 0;
    parsedCQScore = Math.min(Math.max(parsedCQScore, 0), cqMaxMarks);

    const finalTotalScore = (attempt.mcqScore || 0) + parsedCQScore;
    const passed = finalTotalScore >= (exam?.passMarks || 40);

    attempt.cqScore = parsedCQScore;
    attempt.totalScore = finalTotalScore;
    attempt.teacherFeedback = teacherFeedback;
    if (typeof annotatedFileUrl === 'string') {
      attempt.annotatedFileUrl = annotatedFileUrl.trim();
    }
    if (typeof annotatedFileName === 'string' && annotatedFileName.trim()) {
      attempt.annotatedFileName = annotatedFileName.trim();
    }
    const wasEvaluated = attempt.isEvaluated;
    attempt.isEvaluated = true;
    attempt.evaluatedBy = user?._id;
    attempt.evaluatedAt = new Date();
    attempt.passed = passed;
    attempt.status = 'evaluated';

    await attempt.save();
    if (!wasEvaluated) dispatchNotification(notifyStudent(attempt.gravId, `পরীক্ষার ফল: ${exam.title}`,
      `"${exam.title}" পরীক্ষার ফল প্রস্তুত।\n${classroomLink(exam.batchId.toString(), `/exams/${exam._id}/result`)}`));

    return res.status(200).json({
      success: true,
      message: 'শিক্ষার্থীর খাতা মূল্যায়ন ও মার্কিং সফলভাবে সংরক্ষিত হয়েছে!',
      data: attempt,
    });
  } catch (error) {
    console.error('evaluateStudentAttempt error:', error);
    return res.status(500).json({ success: false, message: 'খাতা মূল্যায়ন করতে ব্যর্থ হয়েছে' });
  }
};

/**
 * Get student result for a specific exam
 */
export const getStudentExamResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const user = req.user;

    const exam = await Examination.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const attempt = await ExamAttempt.findOne({
      examId,
      gravId: user?.gravId,
    }).populate('evaluatedBy', 'name');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'ফলাফল পাওয়া যায়নি' });
    }

    // Only reveal the answer key once the student has no attempts left, or the exam window has closed.
    // Otherwise a student could read correctOptionId here and reuse it on a later attempt.
    const usedAttempts = await ExamAttempt.countDocuments({
      examId,
      gravId: user?.gravId,
      status: { $in: ['submitted', 'evaluated'] },
    });
    const examClosed = new Date() > new Date(exam.endWindow);
    const noAttemptsLeft = usedAttempts >= (exam.attemptLimit || 1);
    const canRevealAnswerKey = noAttemptsLeft || examClosed;

    const questions = canRevealAnswerKey
      ? await Question.find({ examId }).select('questionText options correctOptionId explanation marks')
      : await Question.find({ examId }).select('questionText options marks');

    return res.status(200).json({
      success: true,
      data: {
        exam,
        attempt,
        questions,
        answerKeyWithheld: !canRevealAnswerKey,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exam result' });
  }
};
