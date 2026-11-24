import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { StudentAttendance, IStudentAttendanceRecord } from '../models/StudentAttendance';
import { Batch } from '../models/Batch';
import { Enrollment } from '../models/Enrollment';
import { User } from '../models/User';
import { ROLES } from '../types/roles';

/**
 * Verify if the caller can manage (take/update) attendance for the specified batch.
 * Only Superadmin, Admin, or Teachers assigned to this batch are allowed.
 */
async function canManageBatchAttendance(user: any, batch: any): Promise<boolean> {
  if (!user || !batch) return false;
  if ([ROLES.SUPERADMIN, ROLES.ADMIN].includes(user.role)) return true;
  if (user.role === ROLES.TEACHER) {
    const isAssigned = batch.assignedTeachers?.some(
      (t: any) => t.toString() === user._id.toString()
    );
    return Boolean(isAssigned);
  }
  return false;
}

/**
 * 1. Record / Update Attendance for a Batch on a specific date (Teacher / Admin only)
 */
export const recordAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const { date, topic, records } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' });
    }

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ success: false, message: 'ভুল ব্যাচ আইডি' });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'সঠিক তারিখ দিন (YYYY-MM-DD)' });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'হাজিরা রেকর্ড প্রদান করুন' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'ব্যাচ পাওয়া যায়নি' });
    }

    const isAllowed = await canManageBatchAttendance(user, batch);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'শুধুমাত্র সংশ্লিষ্ট ব্যাচের শিক্ষক ও অ্যাডমিন হাজিরা নিতে পারবেন।',
      });
    }

    // Clean and validate records
    const validStatuses = new Set(['present', 'absent', 'late', 'excused']);
    const sanitizedRecords: IStudentAttendanceRecord[] = records.map((r: any) => ({
      studentId: new mongoose.Types.ObjectId(r.studentId),
      gravId: String(r.gravId).trim(),
      studentName: String(r.studentName || '').trim(),
      status: validStatuses.has(r.status) ? r.status : 'present',
      note: String(r.note || '').trim(),
    }));

    const attendance = await StudentAttendance.findOneAndUpdate(
      { batchId: new mongoose.Types.ObjectId(batchId), date },
      {
        courseId: batch.courseId,
        topic: String(topic || '').trim(),
        records: sanitizedRecords,
        takenBy: user._id,
        takenByName: user.name,
        takenByRole: user.role,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `${date} তারিখের হাজিরা সফলভাবে সংরক্ষিত হয়েছে।`,
      data: attendance,
    });
  } catch (error: any) {
    console.error('recordAttendance error:', error);
    return res.status(500).json({ success: false, message: 'হাজিরা সংরক্ষণ করতে সমস্যা হয়েছে' });
  }
};

/**
 * 2. Get Batch Attendance
 * - Admin/Teacher: Gets full sheet for a date, past session list, and enrolled students list.
 * - Student: Gets only their own attendance summary and session history.
 * - Guardian: Gets only their linked child's attendance summary and session history.
 */
export const getBatchAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const requestedDate = req.query.date as string | undefined;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' });
    }

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ success: false, message: 'ভুল ব্যাচ আইডি' });
    }

    const batch = await Batch.findById(batchId).lean();
    if (!batch) {
      return res.status(404).json({ success: false, message: 'ব্যাচ পাওয়া যায়নি' });
    }

    const isStaff = await canManageBatchAttendance(user, batch);

    // =========================================================================
    // CASE A: TEACHER / ADMIN (Full management view)
    // =========================================================================
    if (isStaff) {
      // 1. Fetch all enrolled students in this batch
      const enrollments = await Enrollment.find({
        batchId: new mongoose.Types.ObjectId(batchId),
        status: { $in: ['enrolled', 'completed'] },
      }).lean();

      const gravIds = enrollments.map((e) => e.gravId);
      const students = await User.find({ gravId: { $in: gravIds } })
        .select('name gravId avatarUrl email phone')
        .lean();

      // Map to consistent format
      const studentMap = new Map<string, any>();
      students.forEach((s) => studentMap.set(s.gravId, s));

      const enrolledStudents = enrollments.map((e) => {
        const profile = studentMap.get(e.gravId);
        return {
          studentId: profile?._id || e._id,
          gravId: e.gravId,
          name: profile?.name || 'শিক্ষার্থী',
          avatarUrl: profile?.avatarUrl,
          phone: profile?.phone,
        };
      });

      // 2. Fetch past attendance sessions for this batch
      const sessions = await StudentAttendance.find({ batchId: new mongoose.Types.ObjectId(batchId) })
        .sort({ date: -1 })
        .select('date topic takenByName takenByRole records createdAt')
        .lean();

      const sessionSummaries = sessions.map((s) => {
        const total = s.records.length;
        const presentCount = s.records.filter((r) => r.status === 'present').length;
        const lateCount = s.records.filter((r) => r.status === 'late').length;
        const absentCount = s.records.filter((r) => r.status === 'absent').length;
        const excusedCount = s.records.filter((r) => r.status === 'excused').length;
        return {
          _id: s._id,
          date: s.date,
          topic: s.topic,
          takenByName: s.takenByName,
          takenByRole: s.takenByRole,
          total,
          presentCount,
          lateCount,
          absentCount,
          excusedCount,
          attendanceRate: total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0,
        };
      });

      // 3. If requestedDate is provided, fetch that exact sheet
      let currentSheet = null;
      if (requestedDate) {
        currentSheet = await StudentAttendance.findOne({
          batchId: new mongoose.Types.ObjectId(batchId),
          date: requestedDate,
        }).lean();
      }

      return res.status(200).json({
        success: true,
        canManage: true,
        data: {
          enrolledStudents,
          sessions: sessionSummaries,
          currentSheet,
          totalSessions: sessions.length,
        },
      });
    }

    // =========================================================================
    // CASE B: STUDENT (Personal attendance view)
    // =========================================================================
    if (user.role === ROLES.STUDENT) {
      const isEnrolled = await Enrollment.findOne({
        batchId: new mongoose.Types.ObjectId(batchId),
        gravId: user.gravId,
        status: { $in: ['enrolled', 'completed'] },
      }).lean();

      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: 'আপনি এই ব্যাচে ভর্তি নন' });
      }

      const allSessions = await StudentAttendance.find({ batchId: new mongoose.Types.ObjectId(batchId) })
        .sort({ date: -1 })
        .lean();

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;

      const history = allSessions
        .map((s) => {
          const rec = s.records.find((r) => r.gravId === user.gravId);
          if (!rec) return null;

          if (rec.status === 'present') presentCount++;
          else if (rec.status === 'late') lateCount++;
          else if (rec.status === 'absent') absentCount++;
          else if (rec.status === 'excused') excusedCount++;

          return {
            date: s.date,
            topic: s.topic,
            status: rec.status,
            note: rec.note,
          };
        })
        .filter(Boolean);

      const totalClasses = history.length;
      const attendanceRate = totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0;

      return res.status(200).json({
        success: true,
        canManage: false,
        data: {
          totalClasses,
          presentCount,
          lateCount,
          absentCount,
          excusedCount,
          attendanceRate,
          history,
        },
      });
    }

    // =========================================================================
    // CASE C: GUARDIAN (Ward attendance view)
    // =========================================================================
    if (user.role === ROLES.GUARDIAN) {
      const guardianDoc = await User.findById(user._id).select('guardianDetails').lean();
      const linkedGravIds = guardianDoc?.guardianDetails?.linkedGravIds || [];

      if (linkedGravIds.length === 0) {
        return res.status(403).json({ success: false, message: 'কোনো শিক্ষার্থী লিংক করা নেই' });
      }

      const requestedGravId = (req.query.gravId as string) || linkedGravIds[0];
      if (!linkedGravIds.includes(requestedGravId)) {
        return res.status(403).json({ success: false, message: 'এই শিক্ষার্থীর তথ্য দেখার অনুমতি নেই' });
      }

      const isWardEnrolled = await Enrollment.findOne({
        batchId: new mongoose.Types.ObjectId(batchId),
        gravId: requestedGravId,
        status: { $in: ['enrolled', 'completed'] },
      }).lean();

      if (!isWardEnrolled) {
        return res.status(403).json({ success: false, message: 'সন্তান এই ব্যাচে ভর্তি নয়' });
      }

      const ward = await User.findOne({ gravId: requestedGravId }).select('name gravId').lean();

      const allSessions = await StudentAttendance.find({ batchId: new mongoose.Types.ObjectId(batchId) })
        .sort({ date: -1 })
        .lean();

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;

      const history = allSessions
        .map((s) => {
          const rec = s.records.find((r) => r.gravId === requestedGravId);
          if (!rec) return null;

          if (rec.status === 'present') presentCount++;
          else if (rec.status === 'late') lateCount++;
          else if (rec.status === 'absent') absentCount++;
          else if (rec.status === 'excused') excusedCount++;

          return {
            date: s.date,
            topic: s.topic,
            status: rec.status,
            note: rec.note,
          };
        })
        .filter(Boolean);

      const totalClasses = history.length;
      const attendanceRate = totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0;

      return res.status(200).json({
        success: true,
        canManage: false,
        data: {
          ward: {
            name: ward?.name || 'শিক্ষার্থী',
            gravId: requestedGravId,
          },
          totalClasses,
          presentCount,
          lateCount,
          absentCount,
          excusedCount,
          attendanceRate,
          history,
        },
      });
    }

    return res.status(403).json({ success: false, message: 'অননুমোদিত ভূমিকা' });
  } catch (error: any) {
    console.error('getBatchAttendance error:', error);
    return res.status(500).json({ success: false, message: 'হাজিরা তথ্য লোড করতে সমস্যা হয়েছে' });
  }
};
