import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Examination, Question, ExamAttempt } from '../models/Examination';
import { Enrollment } from '../models/Enrollment';
import { Batch } from '../models/Batch';
import { ROLES } from '../types/roles';

// Schema for Question Option
const optionSchema = z.object({
  optionId: z.string().min(1),
  text: z.string().min(1),
});

// Schema for MCQ Question
const mcqQuestionSchema = z.object({
  questionText: z.string().min(1),
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
});

/**
 * Create a new examination (Teacher / Admin)
 */
export const createExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const body = createExamSchema.parse(req.body);

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
        options: q.options,
        correctOptionId: q.correctOptionId,
        explanation: q.explanation || '',
        marks: q.marks,
        order: q.order ?? idx,
      }));

      await Question.insertMany(questionDocs);
    }

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

    const exams = await Examination.find({ batchId }).sort({ startWindow: 1 });

    // If user is a student, check their submission status for each exam
    let userAttemptsMap: Record<string, any> = {};
    if (user && user.role === ROLES.STUDENT) {
      const attempts = await ExamAttempt.find({
        batchId,
        studentId: user._id,
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

    return res.status(200).json({ success: true, data: exam });
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
    const isEnrolled = await Enrollment.findOne({
      studentId: user?._id,
      batchId: exam.batchId,
      status: 'enrolled',
    });

    const isTeacherOrAdmin =
      user?.role === ROLES.SUPERADMIN ||
      user?.role === ROLES.ADMIN ||
      user?.role === ROLES.TEACHER;

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
        studentId: user?._id,
        status: { $in: ['submitted', 'evaluated'] },
      });

      if (existingAttempts >= (exam.attemptLimit || 1)) {
        return res.status(400).json({
          success: false,
          message: 'আপনি ইতিমধ্যে এই পরীক্ষায় অংশ নিয়েছেন।',
          alreadySubmitted: true,
        });
      }
    }

    // Fetch MCQ questions without correct answers
    const questions = await Question.find({ examId })
      .select('questionText options marks order')
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

    const attempt = await ExamAttempt.create({
      studentId: user?._id,
      examId: exam._id,
      batchId: exam.batchId,
      submittedAt: new Date(),
      answers: evaluatedAnswers,
      cqAnswers: cqAnswers || [],
      studentDocumentUrl: studentDocumentUrl || '',
      mcqScore,
      cqScore: 0,
      totalScore,
      passed,
      isEvaluated: isAutoEvaluated,
      status: isAutoEvaluated ? 'evaluated' : 'submitted',
    });

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

    const attempts = await ExamAttempt.find({ examId })
      .populate('studentId', 'name email phone avatarUrl studentId')
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      exam,
      count: attempts.length,
      data: attempts,
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
    const { cqScore = 0, teacherFeedback = '' } = req.body;
    const user = req.user;

    const attempt = await ExamAttempt.findById(attemptId).populate('examId');
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'সাবমিশন পাওয়া যায়নি' });
    }

    const exam: any = attempt.examId;
    const parsedCQScore = Number(cqScore) || 0;
    const finalTotalScore = (attempt.mcqScore || 0) + parsedCQScore;
    const passed = finalTotalScore >= (exam?.passMarks || 40);

    attempt.cqScore = parsedCQScore;
    attempt.totalScore = finalTotalScore;
    attempt.teacherFeedback = teacherFeedback;
    attempt.isEvaluated = true;
    attempt.evaluatedBy = user?._id;
    attempt.evaluatedAt = new Date();
    attempt.passed = passed;
    attempt.status = 'evaluated';

    await attempt.save();

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
      studentId: user?._id,
    }).populate('evaluatedBy', 'name');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'ফলাফল পাওয়া যায়নি' });
    }

    // Optional: Return question explanations if exam is completed
    const questions = await Question.find({ examId }).select('questionText options correctOptionId explanation marks');

    return res.status(200).json({
      success: true,
      data: {
        exam,
        attempt,
        questions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exam result' });
  }
};
