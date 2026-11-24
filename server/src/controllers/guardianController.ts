import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { ExamAttempt } from '../models/Examination';
import { Payment } from '../models/Payment';

/**
 * Guardian dashboard overview: for each linked student (ward), returns their
 * enrolled batches, recent exam results, and payment total â€” all authorization
 * is scoped to guardianDetails.linkedGravIds, never arbitrary gravIds.
 */
export const getGuardianOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'guardian') {
      return res.status(403).json({ success: false, message: 'শুধুমাত্র অভিভাবকরা এই তথ্য দেখতে পারবেন' });
    }

    const guardianDoc = await User.findById(user._id)
      .lean();

    const linkedGravIds = guardianDoc?.guardianDetails?.linkedGravIds || [];

    if (linkedGravIds.length === 0) {
      return res.status(200).json({ success: true, data: { linkedGravIds: [] } });
    }

    const students = await User.find({ gravId: { $in: linkedGravIds }, role: 'student' })
      .select('name gravId avatarUrl')
      .lean();
    const gravIds = linkedGravIds;

    const [enrollments, examAttempts, payments] = await Promise.all([
      Enrollment.find({ gravId: { $in: gravIds }, status: { $in: ['enrolled', 'completed'] } })
        .populate('batchId', 'name')
        .populate('courseId', 'title')
        .lean(),
      ExamAttempt.find({ gravId: { $in: gravIds }, status: { $in: ['submitted', 'evaluated'] } })
        .populate('examId', 'title totalMarks passMarks')
        .sort({ submittedAt: -1 })
        .lean(),
      Payment.find({ gravId: { $in: gravIds }, status: 'completed' }).lean(),
    ]);

    const data = students.map((student) => {
      const sId = student.gravId;

      const studentEnrollments = enrollments.filter((e) => e.gravId.toString() === sId);
      const studentAttempts = examAttempts.filter((a) => a.gravId.toString() === sId);
      const studentPayments = payments.filter((p) => p.gravId.toString() === sId);

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
        gravId: student.gravId,
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

    return res.status(200).json({ success: true, data: { linkedGravIds: data } });
  } catch (error: any) {
    console.error('getGuardianOverview error:', error);
    return res.status(500).json({ success: false, message: 'ড্যাশবোর্ড তথ্য লোড করতে ব্যর্থ' });
  }
};