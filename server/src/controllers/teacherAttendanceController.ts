import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { TeacherAttendance } from '../models/TeacherAttendance';
import { User } from '../models/User';

const TIME_ZONE = 'Asia/Dhaka';
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const formatDhakaDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

const parseClockMinutes = (value?: string) => {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || hour > 23) return null;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour = hour % 12 + (meridiem === 'PM' ? 12 : 0);
  }
  return hour * 60 + minute;
};

const isWithinScheduleTime = (slot: any, currentMinutes: number) => {
  const start = parseClockMinutes(slot.startTime);
  if (start === null) return false;
  const end = parseClockMinutes(slot.endTime) ?? start + 90;
  if (end >= 1440) return currentMinutes >= start || currentMinutes <= end - 1440;
  return end >= start
    ? currentMinutes >= start && currentMinutes <= end
    : currentMinutes >= start || currentMinutes <= end;
};

const getBangladeshClockMinutes = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  return hour * 60 + minute;
};

const weekdayForDate = (date: string) => {
  const day = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  return DAY_KEYS[day];
};

const dateInBatchRange = (batch: any, date: string) => {
  const startDate = batch.startDate ? formatDhakaDate(new Date(batch.startDate)) : '';
  const endDate = batch.endDate ? formatDhakaDate(new Date(batch.endDate)) : '';
  return (!startDate || date >= startDate) && (!endDate || date <= endDate);
};

const assignedBatchesForTeacher = async (teacherId: mongoose.Types.ObjectId) => {
  const courses = await Course.find({ instructors: teacherId }).select('_id').lean();
  const courseIds = courses.map((course) => course._id);
  return Batch.find({
    $or: [
      { assignedTeachers: teacherId },
      ...(courseIds.length ? [{ courseId: { $in: courseIds } }] : []),
    ],
  })
    .populate('courseId', 'title subject gradeLevel')
    .sort({ name: 1 })
    .lean();
};

const teacherIsAssigned = (batch: any, teacherId: mongoose.Types.ObjectId) => {
  const directlyAssigned = (batch.assignedTeachers || []).some((id: any) => id.toString() === teacherId.toString());
  const courseInstructors = batch.courseId?.instructors || [];
  const assignedByCourse = courseInstructors.some((id: any) => id.toString() === teacherId.toString());
  return directlyAssigned || assignedByCourse;
};

const isScheduledForDate = (batch: any, date: string) => {
  if (!dateInBatchRange(batch, date)) return false;
  const day = weekdayForDate(date);
  return (batch.weeklySchedule || []).some((slot: any) => String(slot.day).toLowerCase() === day);
};

const validateDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const getQuickAttendance = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const today = formatDhakaDate(now);
    const currentMinutes = getBangladeshClockMinutes(now);
    const batches = await Batch.find({ status: { $in: ['active', 'upcoming'] } })
      .populate('courseId', 'title subject gradeLevel instructors')
      .populate('assignedTeachers', 'name gravId email avatarUrl role status')
      .lean();

    const running: any[] = [];
    for (const batch of batches as any[]) {
      if (!dateInBatchRange(batch, today)) continue;
      const schedule = (batch.weeklySchedule || []).find((slot: any) =>
        String(slot.day).toLowerCase() === weekdayForDate(today) && isWithinScheduleTime(slot, currentMinutes)
      );
      if (!schedule) continue;

      const directTeachers = batch.assignedTeachers || [];
      const courseTeacherIds = (batch.courseId?.instructors || []).map((teacher: any) => teacher.toString());
      const courseTeachers = courseTeacherIds.length
        ? await User.find({ _id: { $in: courseTeacherIds }, role: 'teacher', status: { $nin: ['suspended', 'deactivated'] } })
            .select('name gravId email avatarUrl role')
            .lean()
        : [];
      const teacherMap = new Map<string, any>();
      [...directTeachers, ...courseTeachers].forEach((teacher: any) => {
        if (teacher?.role === 'teacher' && !['suspended', 'deactivated'].includes(teacher.status)) {
          teacherMap.set(teacher._id.toString(), teacher);
        }
      });
      for (const teacher of teacherMap.values()) {
        const attendance = await TeacherAttendance.findOne({ teacherId: teacher._id, batchId: batch._id, attendanceDate: today })
          .select('status markedAt source')
          .lean();
        running.push({
          batchId: batch._id,
          batchName: batch.name,
          courseId: batch.courseId?._id,
          courseName: batch.courseId?.title || '',
          startTime: schedule.startTime,
          endTime: schedule.endTime || '',
          teacher,
          attendance: attendance || null,
        });
      }
    }
    return res.json({ success: true, date: today, data: running });
  } catch (error: any) {
    console.error('getQuickAttendance error:', error);
    return res.status(500).json({ success: false, message: 'Quick attendance load করা যায়নি।' });
  }
};

export const getAttendanceTeachers = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const teachers = await User.find({ role: 'teacher', status: { $nin: ['suspended', 'deactivated'] } })
      .select('name gravId email avatarUrl status')
      .sort({ name: 1 })
      .lean();
    const data = await Promise.all(teachers.map(async (teacher) => {
      const batches = await assignedBatchesForTeacher(teacher._id);
      const historyCount = await TeacherAttendance.countDocuments({ teacherId: teacher._id });
      const activeBatchCount = batches.filter((batch: any) => ['active', 'upcoming'].includes(batch.status)).length;
      return { ...teacher, batchCount: batches.length, activeBatchCount, historyCount };
    }));
    return res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error('getAttendanceTeachers error:', error);
    return res.status(500).json({ success: false, message: 'Teacher list load করা যায়নি।' });
  }
};

export const getTeacherAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teacherId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ success: false, message: 'ভুল teacher ID।' });
    }
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const teacher = await User.findOne({ _id: teacherObjectId, role: 'teacher' })
      .select('name gravId email avatarUrl')
      .lean();
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher পাওয়া যায়নি।' });

    const { date, courseId, batchId } = req.query;
    const selectedDate = typeof date === 'string' ? date : '';
    if (selectedDate && !validateDate(selectedDate)) {
      return res.status(400).json({ success: false, message: 'তারিখটি সঠিক format-এ দিন।' });
    }
    const month = typeof req.query.month === 'string' ? req.query.month : formatDhakaDate().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'মাসটি সঠিক format-এ দিন।' });
    }

    let batches = await assignedBatchesForTeacher(teacherObjectId);
    if (courseId && mongoose.Types.ObjectId.isValid(String(courseId))) {
      batches = batches.filter((batch: any) => batch.courseId?._id?.toString() === String(courseId));
    }
    if (batchId && mongoose.Types.ObjectId.isValid(String(batchId))) {
      batches = batches.filter((batch: any) => batch._id.toString() === String(batchId));
    }
    const batchIds = batches.map((batch: any) => batch._id);
    const attendanceFilter: any = { teacherId: teacherObjectId, batchId: { $in: batchIds } };
    if (selectedDate) attendanceFilter.attendanceDate = selectedDate;

    const attendanceRecords = await TeacherAttendance.find(attendanceFilter)
      .populate('batchId', 'name')
      .populate('courseId', 'title')
      .populate('markedBy', 'name gravId')
      .sort({ attendanceDate: -1, markedAt: -1 })
      .lean();
    const attendanceByBatch = new Map(attendanceRecords.map((record: any) => [record.batchId?._id?.toString() || record.batchId?.toString(), record]));

    let rows: any[];
    if (selectedDate) {
      rows = batches.flatMap((batch: any) => {
        if (!isScheduledForDate(batch, selectedDate)) return [];
        const slots = (batch.weeklySchedule || []).filter((slot: any) => String(slot.day).toLowerCase() === weekdayForDate(selectedDate));
        return slots.map((slot: any) => ({
          batchId: batch._id,
          batchName: batch.name,
          courseId: batch.courseId?._id,
          courseName: batch.courseId?.title || '',
          startTime: slot.startTime,
          endTime: slot.endTime || '',
          topic: slot.topic || '',
          attendance: attendanceByBatch.get(batch._id.toString()) || null,
        }));
      }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    } else {
      rows = attendanceRecords.map((record: any) => ({
        _id: record._id,
        attendanceDate: record.attendanceDate,
        markedAt: record.markedAt,
        source: record.source,
        status: record.status,
        batchId: record.batchId?._id,
        batchName: record.batchId?.name || '',
        courseId: record.courseId?._id,
        courseName: record.courseId?.title || '',
        markedBy: record.markedBy,
      }));
    }

    const year = Number(month.slice(0, 4));
    const monthIndex = Number(month.slice(5, 7)) - 1;
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const scheduledDates: string[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const calendarDate = `${month}-${String(day).padStart(2, '0')}`;
      if (batches.some((batch: any) => isScheduledForDate(batch, calendarDate))) scheduledDates.push(calendarDate);
    }

    const uniqueCourses = Array.from(new Map(batches.map((batch: any) => [batch.courseId?._id?.toString(), {
      _id: batch.courseId?._id,
      title: batch.courseId?.title || 'Course',
    }])).values());
    return res.json({
      success: true,
      teacher,
      date: selectedDate || null,
      mode: selectedDate ? 'schedule' : 'history',
      scheduledDates,
      courses: uniqueCourses,
      batches: batches.map((batch: any) => ({ _id: batch._id, name: batch.name, courseId: batch.courseId?._id, courseName: batch.courseId?.title || '' })),
      data: rows,
    });
  } catch (error: any) {
    console.error('getTeacherAttendance error:', error);
    return res.status(500).json({ success: false, message: 'Attendance history load করা যায়নি।' });
  }
};

export const markTeacherPresent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teacherId, batchId, date, source = 'manual' } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(teacherId) || !mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ success: false, message: 'Teacher বা batch নির্বাচন সঠিক নয়।' });
    }
    if (!validateDate(date)) return res.status(400).json({ success: false, message: 'সঠিক attendance date দিন।' });
    if (source !== 'quick' && source !== 'manual') return res.status(400).json({ success: false, message: 'Attendance source সঠিক নয়।' });
    const today = formatDhakaDate();
    if (date > today) return res.status(400).json({ success: false, message: 'ভবিষ্যৎ তারিখে attendance mark করা যাবে না।' });
    if (source === 'quick' && date !== today) {
      return res.status(400).json({ success: false, message: 'Quick attendance শুধু আজকের চলমান class-এর জন্য।' });
    }

    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const batch = await Batch.findById(batchId).populate('courseId', 'title instructors');
    const teacher = await User.findOne({ _id: teacherObjectId, role: 'teacher', status: { $nin: ['suspended', 'deactivated'] } }).select('_id');
    if (!teacher || !batch) return res.status(404).json({ success: false, message: 'Teacher বা batch পাওয়া যায়নি।' });
    if (!teacherIsAssigned(batch, teacherObjectId)) {
      return res.status(403).json({ success: false, message: 'এই teacher এই batch-এর assigned নন।' });
    }
    if (!isScheduledForDate(batch, date)) {
      return res.status(400).json({ success: false, message: 'এই তারিখে batch-এর class schedule নেই।' });
    }
    if (source === 'quick') {
      const currentMinutes = getBangladeshClockMinutes();
      const isRunningNow = ['active', 'upcoming'].includes(batch.status) && (batch.weeklySchedule || []).some((slot: any) =>
        String(slot.day).toLowerCase() === weekdayForDate(today) && isWithinScheduleTime(slot, currentMinutes)
      );
      if (!isRunningNow || !dateInBatchRange(batch, today)) {
        return res.status(400).json({ success: false, message: 'এই batch এখন চলমান নয়।' });
      }
    }

    const existing = await TeacherAttendance.findOne({ teacherId: teacherObjectId, batchId: batch._id, attendanceDate: date });
    if (existing) {
      return res.json({ success: true, alreadyMarked: true, message: 'Attendance আগেই present mark করা হয়েছে।', data: existing });
    }
    const attendance = await TeacherAttendance.create({
      teacherId: teacherObjectId,
      batchId: batch._id,
      courseId: (batch.courseId as any)._id || batch.courseId,
      attendanceDate: date,
      status: 'present',
      source,
      markedBy: req.user!._id,
      markedAt: new Date(),
    });
    return res.status(201).json({ success: true, message: 'Teacher attendance present mark হয়েছে।', data: attendance });
  } catch (error: any) {
    if (error?.code === 11000) {
      const existing = await TeacherAttendance.findOne({ teacherId: req.body?.teacherId, batchId: req.body?.batchId, attendanceDate: req.body?.date });
      return res.json({ success: true, alreadyMarked: true, message: 'Attendance আগেই present mark করা হয়েছে।', data: existing });
    }
    console.error('markTeacherPresent error:', error);
    return res.status(500).json({ success: false, message: 'Attendance save করা যায়নি।' });
  }
};
