import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { TeacherAttendance } from '../models/TeacherAttendance';
import { TeacherPayment } from '../models/TeacherPayment';
import { User } from '../models/User';
import { generateReceiptNumber } from './financeController';

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
      ...(courseIds.length ? [{
        courseId: { $in: courseIds },
        $or: [
          { assignedTeachers: { $exists: false } },
          { assignedTeachers: { $size: 0 } },
        ],
      }] : []),
    ],
  })
    .populate('courseId', 'title subject gradeLevel instructors')
    .sort({ name: 1 })
    .lean();
};

const teacherIsAssigned = (batch: any, teacherId: mongoose.Types.ObjectId) => {
  const directlyAssigned = (batch.assignedTeachers || []).some((id: any) => id.toString() === teacherId.toString());
  if ((batch.assignedTeachers || []).length > 0) return directlyAssigned;
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

const getClassKey = (teacherId: any, batchId: any, date: string, slot: any) => JSON.stringify([
  teacherId.toString(), batchId.toString(), date, String(slot.startTime || ''), String(slot.endTime || ''), String(slot.topic || ''),
]);

export const getQuickAttendance = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const today = formatDhakaDate(now);
    const batches = await Batch.find({ status: { $in: ['active', 'upcoming'] } })
      .populate('courseId', 'title subject gradeLevel instructors')
      .populate('assignedTeachers', 'name gravId email avatarUrl role status')
      .lean();

    const running: any[] = [];
    for (const batch of batches as any[]) {
      if (!dateInBatchRange(batch, today)) continue;
      const schedules = (batch.weeklySchedule || []).filter((slot: any) =>
        String(slot.day).toLowerCase() === weekdayForDate(today)
      );
      if (!schedules.length) continue;

      const directTeachers = batch.assignedTeachers || [];
      const courseTeacherIds = directTeachers.length ? [] : (batch.courseId?.instructors || []).map((teacher: any) => teacher.toString());
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
          startTime: schedules.map((slot: any) => slot.startTime).join(', '),
          endTime: schedules.length === 1 ? schedules[0].endTime || '' : '',
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

export const getAttendanceTeachers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const selectedDate = typeof req.query.date === 'string' ? req.query.date : '';
    if (selectedDate && !validateDate(selectedDate)) {
      return res.status(400).json({ success: false, message: 'তারিখটি সঠিক format-এ দিন।' });
    }
    const teachers = await User.find({ role: 'teacher', status: { $nin: ['suspended', 'deactivated'] } })
      .select('name gravId email avatarUrl status')
      .sort({ name: 1 })
      .lean();
    const data = await Promise.all(teachers.map(async (teacher) => {
      const batches = await assignedBatchesForTeacher(teacher._id);
      const scheduledBatches = selectedDate ? batches.filter((batch: any) => isScheduledForDate(batch, selectedDate)) : batches;
      if (selectedDate && scheduledBatches.length === 0) return null;
      const historyCount = await TeacherAttendance.countDocuments({ teacherId: teacher._id });
      const activeBatchCount = scheduledBatches.filter((batch: any) => ['active', 'upcoming'].includes(batch.status)).length;
      return { ...teacher, batchCount: selectedDate ? scheduledBatches.length : batches.length, activeBatchCount, historyCount };
    }));
    const filteredTeachers = data.filter(Boolean);
    return res.json({ success: true, count: filteredTeachers.length, date: selectedDate || null, data: filteredTeachers });
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

    const { date, courseId, batchId, startDate, endDate } = req.query;
    const selectedDate = typeof date === 'string' ? date : '';
    if (selectedDate && !validateDate(selectedDate)) {
      return res.status(400).json({ success: false, message: 'তারিখটি সঠিক format-এ দিন।' });
    }
    const month = typeof req.query.month === 'string' ? req.query.month : formatDhakaDate().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'মাসটি সঠিক format-এ দিন।' });
    }
    const hasStart = typeof startDate === 'string' && startDate.length > 0;
    const hasEnd = typeof endDate === 'string' && endDate.length > 0;
    if (hasStart !== hasEnd || (hasStart && (!validateDate(startDate) || !validateDate(endDate) || String(startDate) > String(endDate)))) {
      return res.status(400).json({ success: false, message: 'Start ও end date সঠিকভাবে নির্বাচন করুন।' });
    }

    const year = Number(month.slice(0, 4));
    const monthIndex = Number(month.slice(5, 7)) - 1;
    const monthStart = `${month}-01`;
    const monthEnd = `${month}-${String(new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()).padStart(2, '0')}`;
    const rangeStart = selectedDate || (hasStart ? String(startDate) : monthStart);
    const rangeEnd = selectedDate || (hasEnd ? String(endDate) : monthEnd);
    const rangeLength = (Date.parse(`${rangeEnd}T12:00:00.000Z`) - Date.parse(`${rangeStart}T12:00:00.000Z`)) / 86_400_000;
    if (rangeLength > 366) return res.status(400).json({ success: false, message: 'একবারে সর্বোচ্চ এক বছরের ক্লাস দেখা যাবে।' });
    const today = formatDhakaDate();
    const visibleRangeEnd = rangeEnd > today ? today : rangeEnd;

    let batches = await assignedBatchesForTeacher(teacherObjectId);
    if (courseId && mongoose.Types.ObjectId.isValid(String(courseId))) {
      batches = batches.filter((batch: any) => batch.courseId?._id?.toString() === String(courseId));
    }
    if (batchId && mongoose.Types.ObjectId.isValid(String(batchId))) {
      batches = batches.filter((batch: any) => batch._id.toString() === String(batchId));
    }
    const batchIds = batches.map((batch: any) => batch._id);
    const attendanceFilter: any = {
      teacherId: teacherObjectId,
      batchId: { $in: batchIds },
      attendanceDate: { $gte: rangeStart, $lte: visibleRangeEnd },
    };

    const attendanceRecords = await TeacherAttendance.find(attendanceFilter)
      .populate('batchId', 'name')
      .populate('courseId', 'title')
      .populate('markedBy', 'name gravId')
      .sort({ attendanceDate: -1, markedAt: -1 })
      .lean();
    const attendanceByBatchDate = new Map(attendanceRecords.map((record: any) => [
      `${record.batchId?._id?.toString() || record.batchId?.toString()}|${record.attendanceDate}`, record,
    ]));

    const days: string[] = [];
    for (let cursor = new Date(`${rangeStart}T12:00:00.000Z`); cursor <= new Date(`${visibleRangeEnd}T12:00:00.000Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      days.push(cursor.toISOString().slice(0, 10));
    }
    const rows = days.flatMap((classDate) => batches.flatMap((batch: any) => {
      if (!isScheduledForDate(batch, classDate)) return [];
      const slots = (batch.weeklySchedule || []).filter((slot: any) => String(slot.day).toLowerCase() === weekdayForDate(classDate));
      return slots.map((slot: any) => ({
        classKey: getClassKey(teacherObjectId, batch._id, classDate, slot),
        attendanceDate: classDate,
        batchId: batch._id,
        batchName: batch.name,
        courseId: batch.courseId?._id,
        courseName: batch.courseId?.title || '',
        startTime: slot.startTime,
        endTime: slot.endTime || '',
        topic: slot.topic || '',
        attendance: attendanceByBatchDate.get(`${batch._id.toString()}|${classDate}`) || null,
      }));
    })).sort((a: any, b: any) => b.attendanceDate.localeCompare(a.attendanceDate) || String(b.startTime).localeCompare(String(a.startTime)));

    const classKeys = rows.map((row: any) => row.classKey);
    const paymentRecords = classKeys.length
      ? await TeacherPayment.find({ teacherId: teacherObjectId, classKeys: { $in: classKeys }, voidedAt: { $exists: false } }).lean()
      : [];
    const paymentsByClassKey = new Map<string, any>();
    paymentRecords.forEach((payment: any) => payment.classes.forEach((item: any) => {
      if (classKeys.includes(item.classKey)) paymentsByClassKey.set(item.classKey, {
        paymentId: payment._id,
        receiptNo: payment.receiptNo,
        amount: item.amount,
        paidAt: payment.paidAt,
      });
    }));
    rows.forEach((row: any) => { row.payment = paymentsByClassKey.get(row.classKey) || null; });

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
      mode: selectedDate ? 'schedule' : hasStart ? 'range' : 'month',
      range: { startDate: rangeStart, endDate: visibleRangeEnd },
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

export const createTeacherPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teacherId, classes, rates = [], amountPaid, notes = '', bulk = false } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(teacherId) || !Array.isArray(classes) || classes.length < 1 || classes.length > 500) {
      return res.status(400).json({ success: false, message: 'Teacher ও class list সঠিকভাবে দিন।' });
    }
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const teacher = await User.findOne({ _id: teacherObjectId, role: 'teacher', status: { $nin: ['suspended', 'deactivated'] } })
      .select('_id name gravId email phone avatarUrl')
      .lean();
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher পাওয়া যায়নি।' });

    const assignedBatches = await assignedBatchesForTeacher(teacherObjectId);
    const batchesById = new Map(assignedBatches.map((batch: any) => [batch._id.toString(), batch]));
    const validatedClasses: any[] = [];
    for (const item of classes) {
      if (!mongoose.Types.ObjectId.isValid(item?.batchId) || !validateDate(item?.date)) {
        return res.status(400).json({ success: false, message: 'Class বা date সঠিক নয়।' });
      }
      if (String(item.date) > formatDhakaDate()) return res.status(400).json({ success: false, message: 'ভবিষ্যৎ class-এর payment করা যাবে না।' });
      const batch = batchesById.get(String(item.batchId));
      if (!batch || !teacherIsAssigned(batch, teacherObjectId) || !isScheduledForDate(batch, String(item.date))) {
        return res.status(400).json({ success: false, message: 'নির্বাচিত teacher-এর schedule-এ কোনো class নেই।' });
      }
      const slot = (batch.weeklySchedule || []).find((candidate: any) =>
        String(candidate.day).toLowerCase() === weekdayForDate(String(item.date))
        && String(candidate.startTime || '') === String(item.startTime || '')
        && String(candidate.endTime || '') === String(item.endTime || '')
        && String(candidate.topic || '') === String(item.topic || '')
      );
      if (!slot) return res.status(400).json({ success: false, message: 'Class schedule পরিবর্তিত হয়েছে। তালিকাটি refresh করে আবার চেষ্টা করুন।' });
      const classKey = getClassKey(teacherObjectId, batch._id, String(item.date), slot);
      if (item.classKey !== classKey) return res.status(400).json({ success: false, message: 'Class তথ্য মেলেনি। তালিকাটি refresh করুন।' });
      validatedClasses.push({
        classKey,
        batchId: batch._id,
        courseId: (batch.courseId as any)._id || batch.courseId,
        courseName: (batch.courseId as any).title || 'Course',
        classDate: String(item.date),
        startTime: String(slot.startTime),
        endTime: String(slot.endTime || ''),
        topic: String(slot.topic || ''),
      });
    }
    const distinctKeys = new Set(validatedClasses.map((item) => item.classKey));
    if (distinctKeys.size !== validatedClasses.length) return res.status(400).json({ success: false, message: 'একই class একাধিকবার নির্বাচন করা হয়েছে।' });

    const presentRecords = await TeacherAttendance.find({
      teacherId: teacherObjectId,
      status: 'present',
      $or: validatedClasses.map((item) => ({ batchId: item.batchId, attendanceDate: item.classDate })),
    }).select('batchId attendanceDate').lean();
    const presentKeys = new Set(presentRecords.map((record) => `${record.batchId}|${record.attendanceDate}`));
    if (validatedClasses.some((item) => !presentKeys.has(`${item.batchId}|${item.classDate}`))) {
      return res.status(400).json({ success: false, message: 'Payment-এর আগে সব নির্বাচিত class-এর হাজিরা Present করুন।' });
    }

    const existingPayment = await TeacherPayment.findOne({ classKeys: { $in: [...distinctKeys] }, voidedAt: { $exists: false } }).select('receiptNo').lean();
    if (existingPayment) return res.status(409).json({ success: false, message: `নির্বাচিত class-এর একটি আগেই paid হয়েছে (${existingPayment.receiptNo})। তালিকাটি refresh করুন।` });

    const rateMap = new Map<string, number>();
    if (!Array.isArray(rates)) return res.status(400).json({ success: false, message: 'Course rate সঠিক নয়।' });
    for (const entry of rates) {
      if (!mongoose.Types.ObjectId.isValid(entry?.courseId) || !Number.isSafeInteger(entry?.rate) || entry.rate < 0) {
        return res.status(400).json({ success: false, message: 'প্রতি course-এর rate শূন্য বা তার বেশি পূর্ণসংখ্যা হতে হবে।' });
      }
      rateMap.set(String(entry.courseId), entry.rate);
    }
    const baseAmounts = validatedClasses.map((item) => {
      const courseIdValue = String(item.courseId);
      return rateMap.has(courseIdValue) ? rateMap.get(courseIdValue)! : null;
    });
    const isBulk = bulk === true;
    if (!isBulk && validatedClasses.length !== 1) return res.status(400).json({ success: false, message: 'Individual payment-এর জন্য একটি class নির্বাচন করুন।' });
    let allocatedAmounts: number[];
    if (!isBulk) {
      if (!Number.isSafeInteger(amountPaid) || amountPaid < 1) return res.status(400).json({ success: false, message: 'Payment amount ১ টাকা বা তার বেশি পূর্ণসংখ্যা দিন।' });
      allocatedAmounts = [amountPaid];
    } else {
      if (baseAmounts.some((amount) => amount === null)) return res.status(400).json({ success: false, message: 'সব course-এর প্রতি class payment rate দিন।' });
      const calculatedTotal = (baseAmounts as number[]).reduce((sum, amount) => sum + amount, 0);
      const finalAmount = amountPaid === undefined ? calculatedTotal : amountPaid;
      if (!Number.isSafeInteger(finalAmount) || finalAmount < 1) return res.status(400).json({ success: false, message: 'Final payment ১ টাকা বা তার বেশি পূর্ণসংখ্যা দিন।' });
      const weights = baseAmounts as number[];
      const weightTotal = weights.reduce((sum, value) => sum + value, 0);
      const normalizedWeights = weightTotal > 0 ? weights : weights.map(() => 1);
      const normalizedTotal = weightTotal > 0 ? weightTotal : weights.length;
      allocatedAmounts = normalizedWeights.map((weight) => Math.floor((finalAmount * weight) / normalizedTotal));
      let remainder = finalAmount - allocatedAmounts.reduce((sum, value) => sum + value, 0);
      for (let index = 0; remainder > 0; index = (index + 1) % allocatedAmounts.length) {
        allocatedAmounts[index] += 1;
        remainder -= 1;
      }
    }
    const groups = new Map<string, { courseId: any; courseName: string; classCount: number; rate: number; subtotal: number }>();
    validatedClasses.forEach((item, index) => {
      const courseIdValue = String(item.courseId);
      const group = groups.get(courseIdValue) || {
        courseId: item.courseId,
        courseName: item.courseName,
        classCount: 0,
        rate: rateMap.get(courseIdValue) ?? allocatedAmounts[index],
        subtotal: 0,
      };
      group.classCount += 1;
      group.subtotal += allocatedAmounts[index];
      groups.set(courseIdValue, group);
      item.amount = allocatedAmounts[index];
    });
    const totalAmount = allocatedAmounts.reduce((sum, value) => sum + value, 0);
    const payment = await TeacherPayment.create({
      receiptNo: await generateReceiptNumber(),
      teacherId: teacherObjectId,
      classes: validatedClasses,
      classKeys: [...distinctKeys],
      courseBreakdown: [...groups.values()],
      amountPaid: totalAmount,
      notes: String(notes).slice(0, 500),
      paidBy: req.user!._id,
      paidAt: new Date(),
    });
    const populated = await TeacherPayment.findById(payment._id)
      .populate('teacherId', 'name gravId email phone avatarUrl')
      .populate('paidBy', 'name gravId')
      .populate('classes.batchId', 'name')
      .populate('classes.courseId', 'title')
      .populate('courseBreakdown.courseId', 'title')
      .lean();
    return res.status(201).json({ success: true, message: 'Teacher payment সংরক্ষিত হয়েছে।', data: populated });
  } catch (error: any) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'নির্বাচিত class-এর payment ইতিমধ্যে তৈরি হয়েছে। তালিকাটি refresh করুন।' });
    console.error('createTeacherPayment error:', error);
    return res.status(500).json({ success: false, message: 'Teacher payment সংরক্ষণ করা যায়নি।' });
  }
};

export const getTeacherPaymentReceipt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.paymentId)) return res.status(400).json({ success: false, message: 'Receipt ID সঠিক নয়।' });
    const payment = await TeacherPayment.findById(req.params.paymentId)
      .populate('teacherId', 'name gravId email phone avatarUrl')
      .populate('paidBy', 'name gravId')
      .populate('classes.batchId', 'name')
      .populate('classes.courseId', 'title')
      .populate('courseBreakdown.courseId', 'title')
      .populate('voidedBy', 'name gravId')
      .populate('undoneClasses.batchId', 'name')
      .populate('undoneClasses.courseId', 'title')
      .lean();
    if (!payment) return res.status(404).json({ success: false, message: 'Teacher receipt পাওয়া যায়নি।' });
    return res.json({ success: true, data: payment });
  } catch (error: any) {
    console.error('getTeacherPaymentReceipt error:', error);
    return res.status(500).json({ success: false, message: 'Teacher receipt load করা যায়নি।' });
  }
};

export const getTeacherPaymentHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.teacherId)) return res.status(400).json({ success: false, message: 'Teacher ID সঠিক নয়।' });
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = 20;
    const filter = { teacherId: new mongoose.Types.ObjectId(req.params.teacherId) };
    const [data, total] = await Promise.all([
      TeacherPayment.find(filter).select('receiptNo amountPaid paidAt voidedAt voidReason classes').sort({ paidAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      TeacherPayment.countDocuments(filter),
    ]);
    return res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('getTeacherPaymentHistory error:', error);
    return res.status(500).json({ success: false, message: 'Payment history load করা যায়নি।' });
  }
};

export const updateTeacherPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.paymentId)) return res.status(400).json({ success: false, message: 'Payment ID সঠিক নয়।' });
    const { amountPaid, expectedAmountPaid, reason } = req.body || {};
    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    if (!Number.isSafeInteger(amountPaid) || amountPaid < 1 || !Number.isSafeInteger(expectedAmountPaid) || expectedAmountPaid < 1 || trimmedReason.length < 3 || trimmedReason.length > 300) {
      return res.status(400).json({ success: false, message: 'সঠিক amount ও কমপক্ষে ৩ অক্ষরের কারণ দিন।' });
    }
    const payment = await TeacherPayment.findOne({ _id: req.params.paymentId, voidedAt: { $exists: false } }).lean();
    if (!payment) return res.status(404).json({ success: false, message: 'Active payment পাওয়া যায়নি।' });
    if (payment.amountPaid !== expectedAmountPaid) return res.status(409).json({ success: false, message: 'Payment বদলে গেছে। Refresh করে আবার চেষ্টা করুন।' });

    const rates = new Map(payment.courseBreakdown.map((course) => [String(course.courseId), course.rate]));
    const weights = payment.classes.map((item) => rates.get(String(item.courseId)) ?? item.amount);
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    if (!Number.isSafeInteger(weightTotal)) return res.status(400).json({ success: false, message: 'Reference fee-এর হিসাব সীমার বাইরে।' });
    const divisor = weightTotal || weights.length;
    const allocations = weights.map((value) => Math.floor(amountPaid * (weightTotal ? value : 1) / divisor));
    let remainder = amountPaid - allocations.reduce((sum, value) => sum + value, 0);
    for (let index = 0; remainder > 0; index = (index + 1) % allocations.length) { allocations[index] += 1; remainder -= 1; }
    const classes = payment.classes.map((item, index) => ({ ...item, amount: allocations[index] }));
    const courseBreakdown = payment.courseBreakdown.map((course) => ({
      ...course,
      subtotal: classes.filter((item) => String(item.courseId) === String(course.courseId)).reduce((sum, item) => sum + item.amount, 0),
    }));
    const updated = await TeacherPayment.findOneAndUpdate({ _id: payment._id, voidedAt: { $exists: false }, amountPaid: expectedAmountPaid, classKeys: payment.classKeys }, {
      $set: { amountPaid, classes, courseBreakdown },
      $push: { amountRevisions: { previousAmount: expectedAmountPaid, newAmount: amountPaid, reason: trimmedReason, changedBy: req.user!._id, changedAt: new Date() } },
    }, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(409).json({ success: false, message: 'Payment বদলে গেছে। Refresh করে আবার চেষ্টা করুন।' });
    return res.json({ success: true, message: 'Teacher payment আপডেট হয়েছে।', data: updated });
  } catch (error) {
    console.error('updateTeacherPayment error:', error);
    return res.status(500).json({ success: false, message: 'Teacher payment আপডেট করা যায়নি।' });
  }
};

export const voidTeacherPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.paymentId)) return res.status(400).json({ success: false, message: 'Payment ID সঠিক নয়।' });
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < 3 || reason.length > 300) return res.status(400).json({ success: false, message: 'বাতিলের কারণ কমপক্ষে ৩ অক্ষরে লিখুন।' });
    const payment = await TeacherPayment.findOne({ _id: req.params.paymentId, voidedAt: { $exists: false } }).select('classKeys amountPaid').lean();
    if (!payment) return res.status(404).json({ success: false, message: 'Active payment পাওয়া যায়নি।' });
    const voided = await TeacherPayment.findOneAndUpdate({ _id: payment._id, voidedAt: { $exists: false }, classKeys: payment.classKeys, amountPaid: payment.amountPaid }, {
      $set: { voidedAt: new Date(), voidedBy: req.user!._id, voidReason: reason, voidedClassKeys: payment.classKeys },
      $unset: { classKeys: 1 },
    }, { new: true }).lean();
    if (!voided) return res.status(409).json({ success: false, message: 'Payment ইতিমধ্যে বদলে গেছে। Refresh করুন।' });
    return res.json({ success: true, message: 'Teacher payment বাতিল হয়েছে।', data: voided });
  } catch (error) {
    console.error('voidTeacherPayment error:', error);
    return res.status(500).json({ success: false, message: 'Teacher payment বাতিল করা যায়নি।' });
  }
};

export const undoClassTeacherPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { classKey, reason = 'Class payment undone by admin' } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(paymentId) || typeof classKey !== 'string' || !classKey) {
      return res.status(400).json({ success: false, message: 'Payment ID ও Class Key সঠিকভাবে দিন।' });
    }

    const trimmedReason = typeof reason === 'string' && reason.trim().length >= 3
      ? reason.trim().slice(0, 300)
      : 'Class payment undone by admin';

    const payment = await TeacherPayment.findOne({ _id: paymentId, voidedAt: { $exists: false } });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'সক্রিয় Payment পাওয়া যায়নি বা এটি ইতিমধ্যে বাতিল করা হয়েছে।' });
    }

    const targetIndex = payment.classes.findIndex((item) => item.classKey === classKey);
    if (targetIndex === -1) {
      return res.status(404).json({ success: false, message: 'এই রিসিটে নির্দিষ্ট ক্লাসটি পাওয়া যায়নি।' });
    }

    const targetClass = payment.classes[targetIndex];
    const removedAmount = targetClass.amount || 0;
    const previousAmount = payment.amountPaid;

    const remainingAmount = previousAmount - removedAmount;
    const currentClassKeys = [...(payment.classKeys || [])];
    if (payment.classes.length <= 1 || remainingAmount <= 0) {
      const voided = await TeacherPayment.findOneAndUpdate(
        { _id: payment._id, voidedAt: { $exists: false }, classKeys: currentClassKeys, amountPaid: previousAmount },
        {
          $set: {
            voidedAt: new Date(),
            voidedBy: req.user!._id,
            voidReason: trimmedReason,
            voidedClassKeys: currentClassKeys,
          },
          $unset: { classKeys: 1 },
        },
        { new: true }
      ).lean();
      if (!voided) return res.status(409).json({ success: false, message: 'Payment বদলে গেছে। Refresh করে আবার চেষ্টা করুন।' });

      return res.json({
        success: true,
        message: `ক্লাসের পেমেন্ট আন্ডু করা হয়েছে এবং রিসিটটি Void হয়েছে। ফাইন্যান্স থেকে ৳${previousAmount} বাদ পড়েছে।`,
        data: { voided: true, paymentId: payment._id },
      });
    }

    payment.classes.splice(targetIndex, 1);
    payment.classKeys = payment.classes.map((item) => item.classKey);
    payment.amountPaid = remainingAmount;

    const courseMap = new Map<string, { courseId: any; courseName: string; classCount: number; rate: number; subtotal: number }>();
    payment.classes.forEach((item) => {
      const cIdStr = String(item.courseId);
      const existing = courseMap.get(cIdStr) || {
        courseId: item.courseId,
        courseName: '',
        classCount: 0,
        rate: 0,
        subtotal: 0,
      };
      existing.classCount += 1;
      existing.subtotal += item.amount;
      const prevCb = payment.courseBreakdown.find((cb) => String(cb.courseId) === cIdStr);
      if (prevCb) {
        existing.courseName = prevCb.courseName;
        existing.rate = prevCb.rate;
      }
      courseMap.set(cIdStr, existing);
    });

    payment.courseBreakdown = Array.from(courseMap.values()).map((entry) => ({
      courseId: entry.courseId,
      courseName: entry.courseName || 'Course',
      classCount: entry.classCount,
      rate: entry.rate,
      subtotal: entry.subtotal,
    }));

    const revision = {
      previousAmount,
      newAmount: payment.amountPaid,
      reason: `${targetClass.classDate} তারিখের ক্লাসের পেমেন্ট (৳${removedAmount}) আন্ডু করা হয়েছে। কারণ: ${trimmedReason}`.slice(0, 300),
      changedBy: req.user!._id,
      changedAt: new Date(),
    };
    const updated = await TeacherPayment.findOneAndUpdate(
      { _id: payment._id, voidedAt: { $exists: false }, classKeys: currentClassKeys, amountPaid: previousAmount },
      {
        $set: { classes: payment.classes, classKeys: payment.classKeys, amountPaid: payment.amountPaid, courseBreakdown: payment.courseBreakdown },
        $push: {
          amountRevisions: revision,
          undoneClasses: {
            classKey: targetClass.classKey,
            batchId: targetClass.batchId,
            courseId: targetClass.courseId,
            classDate: targetClass.classDate,
            startTime: targetClass.startTime,
            endTime: targetClass.endTime || '',
            topic: targetClass.topic || '',
            amount: removedAmount,
            reason: trimmedReason,
            undoneBy: req.user!._id,
            undoneAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(409).json({ success: false, message: 'Payment বদলে গেছে। Refresh করে আবার চেষ্টা করুন।' });

    return res.json({
      success: true,
      message: `ক্লাসের পেমেন্ট সফলভাবে আন্ডু করা হয়েছে। ফাইন্যান্স থেকে ৳${removedAmount} স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়েছে।`,
      data: { voided: false, updatedAmountPaid: payment.amountPaid, paymentId: payment._id },
    });
  } catch (error) {
    console.error('undoClassTeacherPayment error:', error);
    return res.status(500).json({ success: false, message: 'ক্লাসের পেমেন্ট আন্ডু করা সম্ভব হয়নি।' });
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
      return res.status(400).json({ success: false, message: 'Quick attendance শুধু আজকের class-এর জন্য।' });
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
      if (!['active', 'upcoming'].includes(batch.status)) {
        return res.status(400).json({ success: false, message: 'এই batch আজকের quick attendance-এ নেই।' });
      }
    }

    const selectedTeacher = await TeacherAttendance.findOne({ batchId: batch._id, attendanceDate: date, status: 'present', teacherId: { $ne: teacherObjectId } }).select('teacherId').lean();
    if (selectedTeacher) {
      return res.status(409).json({ success: false, message: 'এই batch-এর জন্য ইতিমধ্যে অন্য একজন শিক্ষক Present আছেন। আগে তাঁকে Absent করুন।' });
    }

    const existing = await TeacherAttendance.findOne({ teacherId: teacherObjectId, batchId: batch._id, attendanceDate: date });
    if (existing) {
      if (existing.status === 'absent') {
        existing.status = 'present';
        existing.source = source;
        existing.markedBy = req.user!._id;
        existing.markedAt = new Date();
        existing.statusChanges.push({ from: 'absent', to: 'present', changedBy: req.user!._id, changedAt: new Date() });
        await existing.save();
        return res.json({ success: true, message: 'Teacher attendance আবার present করা হয়েছে।', data: existing });
      }
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
      const selectedTeacher = await TeacherAttendance.findOne({ batchId: req.body?.batchId, attendanceDate: req.body?.date, status: 'present', teacherId: { $ne: req.body?.teacherId } }).select('teacherId').lean();
      if (selectedTeacher) return res.status(409).json({ success: false, message: 'এই batch-এর জন্য ইতিমধ্যে অন্য একজন শিক্ষক Present আছেন। আগে তাঁকে Absent করুন।' });
      const existing = await TeacherAttendance.findOne({ teacherId: req.body?.teacherId, batchId: req.body?.batchId, attendanceDate: req.body?.date });
      return res.json({ success: true, alreadyMarked: true, message: 'Attendance আগেই present mark করা হয়েছে।', data: existing });
    }
    console.error('markTeacherPresent error:', error);
    return res.status(500).json({ success: false, message: 'Attendance save করা যায়নি।' });
  }
};

export const markTeacherAbsent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teacherId, batchId, date } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(teacherId) || !mongoose.Types.ObjectId.isValid(batchId) || !validateDate(date)) {
      return res.status(400).json({ success: false, message: 'Teacher, batch বা date সঠিক নয়।' });
    }
    const attendance = await TeacherAttendance.findOne({ teacherId, batchId, attendanceDate: date });
    if (!attendance || attendance.status !== 'present') {
      return res.status(409).json({ success: false, message: 'এই class বর্তমানে Present নয়। তালিকাটি refresh করুন।' });
    }
    const paid = await TeacherPayment.exists({
      teacherId,
      voidedAt: { $exists: false },
      classes: { $elemMatch: { batchId: new mongoose.Types.ObjectId(batchId), classDate: date } },
    });
    if (paid) return res.status(409).json({ success: false, message: 'এই class-এর payment আগে Void করুন, তারপর Absent করুন।' });
    const updated = await TeacherAttendance.findOneAndUpdate(
      { _id: attendance._id, status: 'present' },
      { $set: { status: 'absent' }, $push: { statusChanges: { from: 'present', to: 'absent', changedBy: req.user!._id, changedAt: new Date() } } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(409).json({ success: false, message: 'Attendance বদলে গেছে। Refresh করুন।' });
    return res.json({ success: true, message: 'Teacher attendance Absent করা হয়েছে।', data: updated });
  } catch (error) {
    console.error('markTeacherAbsent error:', error);
    return res.status(500).json({ success: false, message: 'Attendance সংশোধন করা যায়নি।' });
  }
};
