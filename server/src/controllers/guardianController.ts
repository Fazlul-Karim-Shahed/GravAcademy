import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { ExamAttempt } from '../models/Examination';
import { Payment } from '../models/Payment';

/**
 * Guardian dashboard overview: for each linked student (ward), returns their
 * enrolled batches, recent exam results, and payment total — all authorization
 * is scoped to guardianDetails.linkedStudents, never arbitrary studentIds.
 */
export const getGuardianOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'guardian') {
      return res.status(403).json({ success: false, message: 'শুধুমাত্র অভিভাবকরা এই তথ্য দেখতে পারবেন' });
    }

    const guardianDoc = await User.findById(user._id)
      .populate('guardianDetails.linkedStudents', 'name userId avatarUrl phone studentDetails')
      .lean();

    const linkedStudents = (guardianDoc?.guardianDetails?.linkedStudents || []) as any[];

    if (linkedStudents.length === 0) {
      return res.status(200).json({ success: true, data: { linkedStudents: [] } });
    }

    const studentIds = linkedStudents.map((s) => s._id);

    const [enrollments, examAttempts, payments] = await Promise.all([
      Enrollment.find({ studentId: { $in: studentIds }, status: { $in: ['enrolled', 'completed'] } })
        .populate('batchId', 'name')
        .populate('courseId', 'title')
        .lean(),
      ExamAttempt.find({ studentId: { $in: studentIds }, status: { $in: ['submitted', 'evaluated'] } })
        .populate('examId', 'title totalMarks passMarks')
        .sort({ submittedAt: -1 })
        .lean(),
      Payment.find({ studentId: { $in: studentIds }, status: 'completed' }).lean(),
    ]);

    const data = linkedStudents.map((student) => {
      const sId = student._id.toString();

      const studentEnrollments = enrollments.filter((e) => e.studentId.toString() === sId);
      const studentAttempts = examAttempts.filter((a) => a.studentId.toString() === sId);
      const studentPayments = payments.filter((p) => p.studentId.toString() === sId);

      const evaluatedAttempts = studentAttempts.filter((a) => a.isEvaluated);
      const averageScorePercent =
        evaluatedAttempts.length > 0
          ? Math.round(
              evaluatedAttempts.reduce((sum, a) => {
                const exam = a.examId as any;
                const pct = exam?.totalMarks ? (a.totalScore / exam.totalMarks) * 100 : 0;
                return sum + pct;
              }, 0) / evaluatedAttempts.length
            )
          : null;

      const totalPaid = studentPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

      return {
        _id: student._id,
        name: student.name,
        userId: student.userId,
        avatarUrl: student.avatarUrl,
        batches: studentEnrollments.map((e) => ({
          batchId: (e.batchId as any)?._id,
          batchName: (e.batchId as any)?.name,
          courseName: (e.courseId as any)?.title,
        })),
        examSummary: {
          totalAttempts: studentAttempts.length,
          evaluatedCount: evaluatedAttempts.length,
          averageScorePercent,
          recentResults: studentAttempts.slice(0, 5).map((a) => ({
            examId: (a.examId as any)?._id,
            examTitle: (a.examId as any)?.title,
            totalScore: a.totalScore,
            totalMarks: (a.examId as any)?.totalMarks,
            passed: a.passed,
            isEvaluated: a.isEvaluated,
          })),
        },
        paymentSummary: {
          totalPaid,
        },
      };
    });

    return res.status(200).json({ success: true, data: { linkedStudents: data } });
  } catch (error: any) {
    console.error('getGuardianOverview error:', error);
    return res.status(500).json({ success: false, message: 'ড্যাশবোর্ড তথ্য লোড করতে ব্যর্থ' });
  }
};
