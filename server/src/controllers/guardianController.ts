import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { ExamAttempt } from '../models/Examination';
import { Payment } from '../models/Payment';
import { StudentAttendance } from '../models/StudentAttendance';

/**
 * Guardian dashboard overview: for each linked student (ward), returns their
 * enrolled batches, recent exam results, attendance summary, and payment total — all authorization
 * is scoped to guardianDetails.linkedGravIds, never arbitrary gravIds.
 */
export const getGuardianOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'guardian') {
      return res.status(403).json({ success: false, message: 'শুধুমাত্র অভিভাবকরা এই তথ্য দেখতে পারবেন' });
    }

    const guardianDoc = await User.findById(user._id).lean();
    const linkedGravIds = guardianDoc?.guardianDetails?.linkedGravIds || [];

    if (linkedGravIds.length === 0) {
      return res.status(200).json({ success: true, data: { linkedGravIds: [] } });
    }

    const students = await User.find({ gravId: { $in: linkedGravIds }, role: 'student' })
      .select('name gravId avatarUrl')
      .lean();
    const gravIds = linkedGravIds;

    const [enrollments, examAttempts, payments, attendances] = await Promise.all([
      Enrollment.find({ gravId: { $in: gravIds }, status: { $in: ['enrolled', 'completed'] } })
        .populate('batchId', 'name')
        .populate('courseId', 'title')
        .lean(),
      ExamAttempt.find({ gravId: { $in: gravIds }, status: { $in: ['submitted', 'evaluated'] } })
        .populate('examId', 'title totalMarks passMarks')
        .sort({ submittedAt: -1 })
        .lean(),
      Payment.find({ gravId: { $in: gravIds }, status: 'completed' }).lean(),
      StudentAttendance.find({ 'records.gravId': { $in: gravIds } })
        .sort({ date: -1 })
        .lean(),
    ]);

    const data = students.map((student) => {
      const sId = student.gravId;

      const studentEnrollments = enrollments.filter((e) => e.gravId.toString() === sId);
      const studentAttempts = examAttempts.filter((a) => a.gravId.toString() === sId);
      const studentPayments = payments.filter((p) => p.gravId.toString() === sId);

      // Safe exam score calculations (skip deleted exams without totalMarks)
      const validEvaluatedAttempts = studentAttempts.filter(
        (a) => a.isEvaluated && a.examId && (a.examId as any).totalMarks > 0
      );

      const averageScorePercent =
        validEvaluatedAttempts.length > 0
          ? Math.round(
              validEvaluatedAttempts.reduce((sum, a) => {
                const exam = a.examId as any;
                const pct = (a.totalScore / exam.totalMarks) * 100;
                return sum + pct;
              }, 0) / validEvaluatedAttempts.length
            )
          : null;

      // Attendance calculations
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let totalClasses = 0;

      attendances.forEach((att) => {
        const rec = att.records.find((r) => r.gravId === sId);
        if (rec) {
          totalClasses++;
          if (rec.status === 'present') presentCount++;
          else if (rec.status === 'late') lateCount++;
          else if (rec.status === 'absent') absentCount++;
        }
      });

      const attendanceRate =
        totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : null;

      const totalPaid = studentPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

      return {
        _id: student._id,
        name: student.name,
        gravId: student.gravId,
        avatarUrl: student.avatarUrl,
        batches: studentEnrollments.map((e) => ({
          batchId: (e.batchId as any)?._id,
          batchName: (e.batchId as any)?.name || 'অজ্ঞাত ব্যাচ',
          courseName: (e.courseId as any)?.title || 'কোর্স',
        })),
        examSummary: {
          totalAttempts: studentAttempts.length,
          evaluatedCount: validEvaluatedAttempts.length,
          averageScorePercent,
          recentResults: studentAttempts.slice(0, 5).map((a) => {
            const exam = a.examId as any;
            return {
              examId: exam?._id || a._id,
              examTitle: exam?.title || 'পরীক্ষা',
              totalScore: a.totalScore ?? 0,
              totalMarks: exam?.totalMarks ?? 100,
              passed: Boolean(a.passed),
              isEvaluated: Boolean(a.isEvaluated),
            };
          }),
        },
        attendanceSummary: {
          totalClasses,
          presentCount,
          absentCount,
          lateCount,
          attendanceRate,
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
