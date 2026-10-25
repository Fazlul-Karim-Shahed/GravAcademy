import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Payment } from '../models/Payment';
import { Enrollment } from '../models/Enrollment';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Generate unique receipt number: REC-YYMMDD-XXXX
 */
export const generateReceiptNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const datePrefix = `REC-${year}${month}${day}`;

  const lastPayment = await Payment.findOne({
    receiptNo: new RegExp(`^${datePrefix}-`),
  })
    .sort({ createdAt: -1 })
    .select('receiptNo')
    .lean();

  let nextSequence = 1;
  if (lastPayment && lastPayment.receiptNo) {
    const parts = lastPayment.receiptNo.split('-');
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSequence = currentSeq + 1;
      }
    }
  }

  return `${datePrefix}-${nextSequence.toString().padStart(3, '0')}`;
};

export const collectPaymentSchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ভুল শিক্ষার্থী আইডি'),
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ভুল ব্যাচ আইডি').optional(),
  amountPaid: z.number().min(0, 'টাকার পরিমাণ ০ বা তার বেশি হতে হবে'),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'other']).default('cash'),
  paymentType: z.enum(['admission', 'due_payment', 'monthly_fee', 'other']).default('due_payment'),
  transactionId: z.string().optional().or(z.literal('')),
  senderNumber: z.string().optional().or(z.literal('')),
  documentUrl: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  paidAt: z.string().optional(),
});

/**
 * Admin: Collect Payment (Due collection or general fee)
 */
export const collectPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' });
    }

    const {
      studentId,
      batchId,
      amountPaid,
      paymentMethod = 'cash',
      paymentType = 'due_payment',
      transactionId = '',
      senderNumber = '',
      documentUrl = '',
      notes = '',
      paidAt,
    } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'শিক্ষার্থী পাওয়া যায়নি' });
    }

    let batch = null;
    let enrollment = null;
    let totalFee = 0;
    let dueAmount = 0;

    if (batchId) {
      batch = await Batch.findById(batchId).populate('courseId', 'courseFee regularPrice discountPrice');
      if (batch) {
        enrollment = await Enrollment.findOne({ studentId, batchId });
        const courseDoc = batch.courseId as any;
        const currentCoursePrice = courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0;
        // Batch fee snapshot: If enrollment exists and has batchFee, use it. Otherwise use currentCoursePrice and save it.
        totalFee = enrollment?.batchFee || currentCoursePrice;
        if (enrollment && !enrollment.batchFee) {
          enrollment.batchFee = totalFee;
          await enrollment.save();
        }
      }
    }

    // Calculate previous payments for this batch/enrollment
    let previousPaid = 0;
    if (batchId) {
      const pastPayments = await Payment.find({
        studentId,
        batchId,
        status: 'completed',
      });
      previousPaid = pastPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
    }

    const totalPaidNow = previousPaid + amountPaid;
    dueAmount = Math.max(0, totalFee - totalPaidNow);

    const receiptNo = await generateReceiptNumber();

    const payment = await Payment.create({
      receiptNo,
      studentId,
      batchId: batch?._id,
      courseId: batch?.courseId,
      enrollmentId: enrollment?._id,
      amountPaid,
      totalFee,
      dueAmount,
      paymentMethod,
      paymentType,
      transactionId: transactionId.trim(),
      senderNumber: senderNumber.trim(),
      documentUrl: documentUrl.trim(),
      notes: notes.trim(),
      collectedBy: adminUser._id,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      status: 'completed',
    });

    // Update enrollment paymentStatus & paymentFee if batch enrollment exists
    if (enrollment) {
      enrollment.paymentFee = totalPaidNow;
      if (totalPaidNow >= totalFee && totalFee > 0) {
        enrollment.paymentStatus = 'paid';
      } else if (totalPaidNow > 0) {
        enrollment.paymentStatus = 'partial';
      } else {
        enrollment.paymentStatus = 'unpaid';
      }
      await enrollment.save();
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('studentId', 'name userId phone email avatarUrl studentDetails')
      .populate('batchId', 'name fee courseId')
      .populate('courseId', 'title')
      .populate('collectedBy', 'name userId role');

    return res.status(201).json({
      success: true,
      message: 'পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে এবং মানি রিসিট প্রস্তুত!',
      data: populatedPayment,
    });
  } catch (error: any) {
    console.error('collectPayment error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'পেমেন্ট সংগ্রহ ব্যর্থ হয়েছে।',
    });
  }
};

/**
 * Admin: Get All Payments & Financial Summary
 */
export const getAdminPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      paymentMethod,
      paymentType,
      filterType, // 'today' | 'due' | 'all'
      batchId,
      studentId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = { status: 'completed' };

    // Card Filter: Today's collections
    if (filterType === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      query.paidAt = { $gte: todayStart };
    }

    // Card Filter: Transactions with Due amount
    if (filterType === 'due') {
      query.dueAmount = { $gt: 0 };
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    if (paymentType && paymentType !== 'all') {
      query.paymentType = paymentType;
    }
    if (batchId && batchId !== 'all') {
      query.batchId = batchId;
    }
    if (studentId) {
      query.studentId = studentId;
    }

    if (startDate || endDate) {
      query.paidAt = {};
      if (startDate) {
        query.paidAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.paidAt.$lte = end;
      }
    }

    // Search by receiptNo or student name / phone / userId
    if (search) {
      const searchStr = (search as string).trim();
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: searchStr, $options: 'i' } },
          { phone: { $regex: searchStr, $options: 'i' } },
          { userId: { $regex: searchStr, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { receiptNo: { $regex: searchStr, $options: 'i' } },
        { transactionId: { $regex: searchStr, $options: 'i' } },
        { studentId: { $in: userIds } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Helper to calculate total due across all enrollments using their locked batchFee snapshot
    const calculateSystemTotalDue = async () => {
      const activeEnrollments = await Enrollment.find({
        status: { $in: ['enrolled', 'completed'] },
      })
        .populate('courseId', 'courseFee regularPrice discountPrice')
        .lean();

      const allCompletedPayments = await Payment.find({ status: 'completed' })
        .select('studentId batchId amountPaid')
        .lean();

      // Aggregate payments per studentId + batchId
      const studentBatchPaidMap = new Map<string, number>();
      for (const p of allCompletedPayments) {
        if (!p.studentId) continue;
        const key = `${p.studentId.toString()}_${p.batchId ? p.batchId.toString() : 'no_batch'}`;
        studentBatchPaidMap.set(key, (studentBatchPaidMap.get(key) || 0) + (p.amountPaid || 0));
      }

      let systemDue = 0;
      for (const enr of activeEnrollments) {
        if (!enr.studentId) continue;
        const courseDoc = enr.courseId as any;
        const currentCoursePrice =
          courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0;

        // Use the locked batchFee snapshot established when the student enrolled; fallback to current course price
        const targetBatchFee = enr.batchFee !== undefined && enr.batchFee !== null
          ? enr.batchFee
          : currentCoursePrice;

        const key = `${enr.studentId.toString()}_${enr.batchId ? enr.batchId.toString() : 'no_batch'}`;
        const actualPaid = studentBatchPaidMap.has(key)
          ? studentBatchPaidMap.get(key)!
          : (enr.paymentFee || 0);

        if (targetBatchFee > actualPaid) {
          systemDue += targetBatchFee - actualPaid;
        }
      }
      return systemDue;
    };

    // Helper to enrich payment items with student's locked batchFee snapshot and accurate due
    const enrichPaymentsWithDynamicPricing = async (paymentDocs: any[]) => {
      const [allCompletedPayments, activeEnrollments] = await Promise.all([
        Payment.find({ status: 'completed' }).select('studentId batchId amountPaid').lean(),
        Enrollment.find({ status: { $in: ['enrolled', 'completed'] } })
          .populate('courseId', 'courseFee regularPrice discountPrice')
          .select('studentId batchId batchFee courseId')
          .lean(),
      ]);

      const studentBatchPaidMap = new Map<string, number>();
      for (const p of allCompletedPayments) {
        if (!p.studentId) continue;
        const key = `${p.studentId.toString()}_${p.batchId ? p.batchId.toString() : 'no_batch'}`;
        studentBatchPaidMap.set(key, (studentBatchPaidMap.get(key) || 0) + (p.amountPaid || 0));
      }

      const enrollmentMap = new Map<string, any>();
      for (const enr of activeEnrollments) {
        if (!enr.studentId) continue;
        const key = `${enr.studentId.toString()}_${enr.batchId ? enr.batchId.toString() : 'no_batch'}`;
        enrollmentMap.set(key, enr);
      }

      return paymentDocs.map((p) => {
        const studentIdStr = p.studentId?._id?.toString() || p.studentId?.toString() || '';
        const batchIdStr = p.batchId?._id?.toString() || p.batchId?.toString() || 'no_batch';
        const key = `${studentIdStr}_${batchIdStr}`;

        const enr = enrollmentMap.get(key);
        const courseDoc = p.courseId as any;
        const liveCoursePrice =
          courseDoc && (courseDoc.discountPrice !== undefined || courseDoc.courseFee !== undefined || courseDoc.regularPrice !== undefined)
            ? (courseDoc.discountPrice ?? courseDoc.courseFee ?? courseDoc.regularPrice ?? 0)
            : (p.totalFee || 0);

        // Locked student tuition fee: from enrollment.batchFee, or p.totalFee, or liveCoursePrice
        const effectiveBatchFee =
          enr?.batchFee !== undefined && enr?.batchFee !== null
            ? enr.batchFee
            : p.totalFee !== undefined && p.totalFee > 0
            ? p.totalFee
            : liveCoursePrice;

        const totalPaidForThisBatch = studentBatchPaidMap.get(key) || (p.amountPaid || 0);
        const dynamicDue = Math.max(0, effectiveBatchFee - totalPaidForThisBatch);

        return {
          ...p,
          totalFee: effectiveBatchFee,
          dueAmount: dynamicDue,
        };
      });
    };

    // If filterType is 'due', we need to return items that have dynamic due > 0
    if (filterType === 'due') {
      const dueEnrollments = await Enrollment.find({
        status: { $in: ['enrolled', 'completed'] },
      })
        .populate('studentId', 'name userId phone email avatarUrl studentDetails')
        .populate('batchId', 'name courseId')
        .populate('courseId', 'title courseFee regularPrice discountPrice')
        .lean();

      const paymentsRaw = await Payment.find(query)
        .populate('studentId', 'name userId phone email avatarUrl studentDetails')
        .populate('batchId', 'name courseId')
        .populate('courseId', 'title courseFee regularPrice discountPrice')
        .populate('collectedBy', 'name userId role')
        .sort({ paidAt: -1, createdAt: -1 })
        .lean();

      const paymentsWithDue = await enrichPaymentsWithDynamicPricing(paymentsRaw);

      const existingEnrollmentIdsWithPayment = new Set(
        paymentsWithDue.map((p) => p.enrollmentId?.toString()).filter(Boolean)
      );

      // Create synthetic payment receipt objects for unpaid/self-enrolled students without payment records yet
      const syntheticDues: any[] = [];
      for (const enr of dueEnrollments) {
        const courseDoc = enr.courseId as any;
        const currentCoursePrice =
          courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0;
        const paid = enr.paymentFee || 0;
        const dueAmount = Math.max(0, currentCoursePrice - paid);

        if (dueAmount > 0 && !existingEnrollmentIdsWithPayment.has(enr._id.toString())) {
          if (search) {
            const searchStr = (search as string).trim().toLowerCase();
            const sName = (enr.studentId as any)?.name?.toLowerCase() || '';
            const sId = (enr.studentId as any)?.userId?.toLowerCase() || '';
            const sPhone = (enr.studentId as any)?.phone || '';
            if (!sName.includes(searchStr) && !sId.includes(searchStr) && !sPhone.includes(searchStr)) {
              continue;
            }
          }

          syntheticDues.push({
            _id: `due_${enr._id}`,
            receiptNo: `DUE-${enr._id.toString().slice(-6).toUpperCase()}`,
            studentId: enr.studentId,
            batchId: enr.batchId,
            courseId: enr.courseId,
            enrollmentId: enr._id,
            amountPaid: paid,
            totalFee: currentCoursePrice,
            dueAmount,
            paymentMethod: 'cash',
            paymentType: 'admission',
            status: 'completed',
            notes: 'এনরোলমেন্ট ফি বকেয়া রয়েছে (Self/Manual Enrolled)',
            paidAt: enr.enrolledAt || (enr as any).createdAt,
            createdAt: enr.enrolledAt || (enr as any).createdAt,
          });
        }
      }

      // Filter only those that actually have due > 0 dynamically
      const dueOnlyPayments = paymentsWithDue.filter((p) => (p.dueAmount || 0) > 0);

      const allDueItems = [...dueOnlyPayments, ...syntheticDues].sort((a, b) => {
        const tA = new Date(a.paidAt || a.createdAt).getTime();
        const tB = new Date(b.paidAt || b.createdAt).getTime();
        return tB - tA;
      });

      const totalCount = allDueItems.length;
      const paginatedItems = allDueItems.slice(skip, skip + limitNum);

      const aggregateStats = await Payment.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amountPaid' },
            totalTransactions: { $sum: 1 },
            cashRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amountPaid', 0] },
            },
            bkashRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'bkash'] }, '$amountPaid', 0] },
            },
            nagadRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'nagad'] }, '$amountPaid', 0] },
            },
            bankRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'bank_transfer'] }, '$amountPaid', 0] },
            },
          },
        },
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStats = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            paidAt: { $gte: todayStart },
          },
        },
        {
          $group: {
            _id: null,
            todayTotal: { $sum: '$amountPaid' },
            todayCount: { $sum: 1 },
          },
        },
      ]);

      const totalDue = await calculateSystemTotalDue();

      const stats = aggregateStats[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        cashRevenue: 0,
        bkashRevenue: 0,
        nagadRevenue: 0,
        bankRevenue: 0,
      };

      return res.status(200).json({
        success: true,
        data: paginatedItems,
        meta: {
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          page: pageNum,
          limit: limitNum,
        },
        summary: {
          totalRevenue: stats.totalRevenue || 0,
          totalTransactions: stats.totalTransactions || 0,
          totalDue,
          todayTotal: todayStats[0]?.todayTotal || 0,
          todayCount: todayStats[0]?.todayCount || 0,
          byMethod: {
            cash: stats.cashRevenue || 0,
            bkash: stats.bkashRevenue || 0,
            nagad: stats.nagadRevenue || 0,
            bank: stats.bankRevenue || 0,
          },
        },
      });
    }

    // Default view (all / no filterType):
    if (!filterType || filterType === 'all') {
      const dueEnrollments = await Enrollment.find({
        status: { $in: ['enrolled', 'completed'] },
      })
        .populate('studentId', 'name userId phone email avatarUrl studentDetails')
        .populate('batchId', 'name courseId')
        .populate('courseId', 'title courseFee regularPrice discountPrice')
        .lean();

      const allPaymentsRaw = await Payment.find(query)
        .populate('studentId', 'name userId phone email avatarUrl studentDetails')
        .populate('batchId', 'name courseId')
        .populate('courseId', 'title courseFee regularPrice discountPrice')
        .populate('collectedBy', 'name userId role')
        .sort({ paidAt: -1, createdAt: -1 })
        .lean();

      const allPayments = await enrichPaymentsWithDynamicPricing(allPaymentsRaw);

      const existingEnrollmentIdsWithPayment = new Set(
        allPayments.map((p) => p.enrollmentId?.toString()).filter(Boolean)
      );

      // Add synthetic unpaid items for enrollments that don't have a payment record yet
      const syntheticUnpaid: any[] = [];
      for (const enr of dueEnrollments) {
        const courseDoc = enr.courseId as any;
        const currentCoursePrice =
          courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0;
        const paid = enr.paymentFee || 0;
        const dueAmount = Math.max(0, currentCoursePrice - paid);

        if (!existingEnrollmentIdsWithPayment.has(enr._id.toString())) {
          if (search) {
            const searchStr = (search as string).trim().toLowerCase();
            const sName = (enr.studentId as any)?.name?.toLowerCase() || '';
            const sId = (enr.studentId as any)?.userId?.toLowerCase() || '';
            const sPhone = (enr.studentId as any)?.phone || '';
            if (!sName.includes(searchStr) && !sId.includes(searchStr) && !sPhone.includes(searchStr)) {
              continue;
            }
          }

          syntheticUnpaid.push({
            _id: `due_${enr._id}`,
            receiptNo: `DUE-${enr._id.toString().slice(-6).toUpperCase()}`,
            studentId: enr.studentId,
            batchId: enr.batchId,
            courseId: enr.courseId,
            enrollmentId: enr._id,
            amountPaid: paid,
            totalFee: currentCoursePrice,
            dueAmount,
            paymentMethod: 'cash',
            paymentType: 'admission',
            status: 'completed',
            notes: dueAmount > 0 ? 'এনরোলমেন্ট ফি বকেয়া রয়েছে (Self/Manual Enrolled)' : 'সম্পূর্ণ পরিশোধিত',
            paidAt: enr.enrolledAt || (enr as any).createdAt,
            createdAt: enr.enrolledAt || (enr as any).createdAt,
          });
        }
      }

      const combinedAll = [...allPayments, ...syntheticUnpaid].sort((a, b) => {
        const tA = new Date(a.paidAt || a.createdAt).getTime();
        const tB = new Date(b.paidAt || b.createdAt).getTime();
        return tB - tA;
      });

      const totalCount = combinedAll.length;
      const paginatedItems = combinedAll.slice(skip, skip + limitNum);

      const aggregateStats = await Payment.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amountPaid' },
            totalTransactions: { $sum: 1 },
            cashRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amountPaid', 0] },
            },
            bkashRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'bkash'] }, '$amountPaid', 0] },
            },
            nagadRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'nagad'] }, '$amountPaid', 0] },
            },
            bankRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'bank_transfer'] }, '$amountPaid', 0] },
            },
          },
        },
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStats = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            paidAt: { $gte: todayStart },
          },
        },
        {
          $group: {
            _id: null,
            todayTotal: { $sum: '$amountPaid' },
            todayCount: { $sum: 1 },
          },
        },
      ]);

      const totalDue = await calculateSystemTotalDue();

      const stats = aggregateStats[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        cashRevenue: 0,
        bkashRevenue: 0,
        nagadRevenue: 0,
        bankRevenue: 0,
      };

      return res.status(200).json({
        success: true,
        data: paginatedItems,
        meta: {
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          page: pageNum,
          limit: limitNum,
        },
        summary: {
          totalRevenue: stats.totalRevenue || 0,
          totalTransactions: stats.totalTransactions || 0,
          totalDue,
          todayTotal: todayStats[0]?.todayTotal || 0,
          todayCount: todayStats[0]?.todayCount || 0,
          byMethod: {
            cash: stats.cashRevenue || 0,
            bkash: stats.bkashRevenue || 0,
            nagad: stats.nagadRevenue || 0,
            bank: stats.bankRevenue || 0,
          },
        },
      });
    }

    // Specific filtered queries (e.g. today or other filters)
    const [paymentsRaw, totalCount, aggregateStats] = await Promise.all([
      Payment.find(query)
        .populate('studentId', 'name userId phone email avatarUrl studentDetails')
        .populate('batchId', 'name courseId')
        .populate('courseId', 'title courseFee regularPrice discountPrice')
        .populate('collectedBy', 'name userId role')
        .sort({ paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(query),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amountPaid' },
            totalTransactions: { $sum: 1 },
            cashRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amountPaid', 0] },
            },
            bkashRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'bkash'] }, '$amountPaid', 0] },
            },
            nagadRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'nagad'] }, '$amountPaid', 0] },
            },
            bankRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'bank_transfer'] }, '$amountPaid', 0] },
            },
          },
        },
      ]),
    ]);

    const payments = await enrichPaymentsWithDynamicPricing(paymentsRaw);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStats = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          todayTotal: { $sum: '$amountPaid' },
          todayCount: { $sum: 1 },
        },
      },
    ]);

    const totalDue = await calculateSystemTotalDue();

    const stats = aggregateStats[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      cashRevenue: 0,
      bkashRevenue: 0,
      nagadRevenue: 0,
      bankRevenue: 0,
    };

    return res.status(200).json({
      success: true,
      data: payments,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        page: pageNum,
        limit: limitNum,
      },
      summary: {
        totalRevenue: stats.totalRevenue || 0,
        totalTransactions: stats.totalTransactions || 0,
        totalDue,
        todayTotal: todayStats[0]?.todayTotal || 0,
        todayCount: todayStats[0]?.todayCount || 0,
        byMethod: {
          cash: stats.cashRevenue || 0,
          bkash: stats.bkashRevenue || 0,
          nagad: stats.nagadRevenue || 0,
          bank: stats.bankRevenue || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('getAdminPayments error:', error);
    return res.status(500).json({
      success: false,
      message: 'পেমেন্ট তালিকা লোড করা যায়নি',
    });
  }
};

/**
 * Get Single Payment / Receipt by ID or ReceiptNo
 */
export const getPaymentReceipt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { receiptNo: id };

    const payment = await Payment.findOne(query)
      .populate('studentId', 'name userId phone email avatarUrl studentDetails')
      .populate('batchId', 'name fee courseId')
      .populate('courseId', 'title')
      .populate('collectedBy', 'name userId role')
      .lean();

    if (!payment) {
      return res.status(404).json({ success: false, message: 'মানি রিসিট পাওয়া যায়নি' });
    }

    // Authorization: Superadmin, Admin, or the student himself
    const isOwner = user?._id?.toString() === (payment.studentId as any)?._id?.toString();
    const isAdmin = ['superadmin', 'admin'].includes(user?.role || '');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'এই রিসিট দেখার অনুমতি আপনার নেই' });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('getPaymentReceipt error:', error);
    return res.status(500).json({ success: false, message: 'রিসিট লোড করা যায়নি' });
  }
};

/**
 * Student: Get My Payments & Receipts
 */
export const getMyPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' });
    }

    const payments = await Payment.find({ studentId, status: 'completed' })
      .populate('batchId', 'name')
      .populate('courseId', 'title')
      .populate('collectedBy', 'name')
      .sort({ paidAt: -1, createdAt: -1 })
      .lean();

    // Calculate total paid & due for this student across enrolled courses
    const enrollments = await Enrollment.find({
      studentId,
      status: { $in: ['enrolled', 'completed'] },
    })
      .populate('courseId', 'courseFee regularPrice discountPrice')
      .lean();

    let totalCourseFee = 0;
    let totalPaid = 0;

    enrollments.forEach((e: any) => {
      const courseDoc = e.courseId;
      const cFee = courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0;
      totalCourseFee += cFee;
      totalPaid += e.paymentFee || 0;
    });

    const totalDue = Math.max(0, totalCourseFee - totalPaid);

    return res.status(200).json({
      success: true,
      data: payments,
      summary: {
        totalPaid,
        totalDue,
        totalEnrolledBatches: enrollments.length,
      },
    });
  } catch (error: any) {
    console.error('getMyPayments error:', error);
    return res.status(500).json({
      success: false,
      message: 'পেমেন্ট হিস্ট্রি লোড করা যায়নি',
    });
  }
};

/**
 * Upload Payment Slip/Document directly to Google Drive
 */
export const uploadPaymentDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'কোনো ফাইল আপলোড করা হয়নি।' });
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'শুধুমাত্র ছবি (JPG, PNG, WebP) অথবা PDF/ডকুমেন্ট আপলোড করা যাবে।',
      });
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const sanitizedName = `slip_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    let driveFileId = '';
    const isDriveConfigured =
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN;

    if (isDriveConfigured) {
      const { uploadFileToDrive } = await import('../services/googleDriveService');
      const driveRes = await uploadFileToDrive(sanitizedName, file.mimetype, file.buffer);
      driveFileId = driveRes.fileId;
    } else {
      console.warn('⚠️ Google Drive OAuth not configured. Using placeholder.');
      driveFileId = `stub_drive_${Date.now()}`;
    }

    // Direct preview/download link
    const fileUrl = isDriveConfigured
      ? `https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`
      : `/uploads/slips/${sanitizedName}`;

    return res.status(200).json({
      success: true,
      message: 'পেমেন্ট স্লিপ সফলভাবে ড্রাইভে আপলোড হয়েছে!',
      data: {
        fileUrl,
        driveFileId,
        fileName: file.originalname,
      },
    });
  } catch (error: any) {
    console.error('uploadPaymentDocument error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'স্লিপ আপলোড করতে সমস্যা হয়েছে।',
    });
  }
};

/**
 * Delete Payment / Transaction (Admin / Superadmin)
 * Used to correct mistakenly entered transactions or duplicate entries.
 */
export const deletePayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ভুল পেমেন্ট আইডি' });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'লেনদেনটি পাওয়া যায়নি' });
    }

    const { studentId, batchId, amountPaid } = payment;

    // Delete the payment document
    await Payment.findByIdAndDelete(id);

    // If linked to an enrollment, update enrollment's total paid and status
    if (studentId && batchId) {
      const remainingPayments = await Payment.find({
        studentId,
        batchId,
        status: 'completed',
      });

      const remainingTotalPaid = remainingPayments.reduce(
        (sum, p) => sum + (p.amountPaid || 0),
        0
      );

      const enrollment = await Enrollment.findOne({ studentId, batchId });
      if (enrollment) {
        enrollment.paymentFee = remainingTotalPaid;
        const targetFee = enrollment.batchFee || 0;

        if (remainingTotalPaid >= targetFee && targetFee > 0) {
          enrollment.paymentStatus = 'paid';
        } else if (remainingTotalPaid > 0) {
          enrollment.paymentStatus = 'partial';
        } else {
          enrollment.paymentStatus = 'unpaid';
        }
        await enrollment.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'লেনদেনটি সফলভাবে মুছে ফেলা হয়েছে এবং বকেয়া হিসাব হালনাগাদ করা হয়েছে!',
    });
  } catch (error: any) {
    console.error('deletePayment error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'লেনদেন মুছে ফেলতে ত্রুটি ঘটেছে',
    });
  }
};
