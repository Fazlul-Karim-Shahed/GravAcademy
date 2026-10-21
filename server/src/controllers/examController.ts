import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { Examination, Question, ExamAttempt } from '../models/Examination';
import { Enrollment } from '../models/Enrollment';
import { ROLES } from '../types/roles';

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
  isPublished: z.boolean().default(false),
});

/**
 * List examinations for a batch
 */
export const getBatchExams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const exams = await Examination.find({ batchId }).sort({ startWindow: 1 });
    return res.status(200).json({ success: true, count: exams.length, data: exams });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exams' });
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

    if (!isEnrolled && user?.role === ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this batch' });
    }

    // Fetch questions without correct answers
    const questions = await Question.find({ examId })
      .select('questionText options marks order')
      .sort({ order: 1 });

    return res.status(200).json({
      success: true,
      data: {
        exam: {
          title: exam.title,
          instructions: exam.instructions,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          negativeMarkPerWrong: exam.negativeMarkPerWrong,
        },
        questions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exam questions' });
  }
};

/**
 * Submit Exam & Server-side Auto Grading
 */
export const submitExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedOptionId }
    const user = req.user;

    const exam = await Examination.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Fetch questions WITH correctOptionId for server-side grading
    const questions = await Question.find({ examId }).select('+correctOptionId');

    let totalScore = 0;
    const evaluatedAnswers = [];

    for (const q of questions) {
      const studentAns = answers.find(
        (a: any) => a.questionId.toString() === q._id.toString()
      );

      if (studentAns && studentAns.selectedOptionId) {
        const isCorrect = studentAns.selectedOptionId === q.correctOptionId;
        let marksAwarded = 0;

        if (isCorrect) {
          marksAwarded = q.marks;
        } else if (exam.negativeMarkPerWrong > 0) {
          marksAwarded = -exam.negativeMarkPerWrong;
        }

        totalScore += marksAwarded;
        evaluatedAnswers.push({
          questionId: q._id,
          selectedOptionId: studentAns.selectedOptionId,
          isCorrect,
          marksAwarded,
        });
      }
    }

    // Floor score at 0
    if (totalScore < 0) totalScore = 0;
    const passed = totalScore >= exam.passMarks;

    const attempt = await ExamAttempt.create({
      studentId: user?._id,
      examId: exam._id,
      batchId: exam.batchId,
      submittedAt: new Date(),
      answers: evaluatedAnswers,
      totalScore,
      passed,
      status: 'submitted',
    });

    return res.status(200).json({
      success: true,
      message: 'Exam submitted and evaluated successfully',
      data: {
        attemptId: attempt._id,
        totalScore,
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
