import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Enrollment } from '../models/Enrollment';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { AuthenticatedRequest } from '../middleware/auth';

import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Payment } from '../models/Payment';
import { EnrollmentRequest } from '../models/EnrollmentRequest';
import { generateUniqueUserId } from './authController';
import { generateReceiptNumber } from './financeController';
import { ROLES } from '../types/roles';

export const enrollBatchSchema = z.object({
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Batch ID'),
});

export const createEnrollmentRequestSchema = z.object({
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Batch ID'),
  name: z.string().min(2).max(120),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  schoolOrCollege: z.string().max(160).optional().or(z.literal('')),
  gradeLevel: z.string().max(80).optional().or(z.literal('')),
  guardianName: z.string().max(120).optional().or(z.literal('')),
  guardianPhone: z.string().max(30).optional().or(z.literal('')),
  message: z.string().max(500).optional().or(z.literal('')),
});

export const adminAdmitStudentSchema = z.object({
  name: z.string().min(2, 'শিক্ষার্থীর নাম আবশ্যক'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('সঠিক ইমেইল ঠিকানা দিন').optional().or(z.literal('')),
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ভুল ব্যাচ আইডি'),
  courseId: z.string().optional().or(z.literal('')),
  schoolOrCollege: z.string().optional().or(z.literal('')),
  gradeLevel: z.string().optional().or(z.literal('')),
  guardianName: z.string().optional().or(z.literal('')),
  guardianPhone: z.string().optional().or(z.literal('')),
  paymentFee: z.number().min(0).default(0),
  paymentStatus: z.enum(['paid', 'unpaid', 'partial']).default('paid'),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'other']).default('cash'),
  transactionId: z.string().optional().or(z.literal('')),
  senderNumber: z.string().optional().or(z.literal('')),
  documentUrl: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  existingStudentId: z.string().optional().or(z.literal('')), // in case an existing student is selected
  requestId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().or(z.literal('')),
});

/**
 * Enroll Current Student into a Batch
 */
export const enrollInBatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.body;
    const studentId = req.user?._id;
    const userRole = req.user?.role;

    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'শুধুমাত্র শিক্ষার্থীদের জন্য এনরোলমেন্ট উন্মুক্ত।',
      });
    }

    const batch = await Batch.findById(batchId).populate('courseId', 'courseFee regularPrice discountPrice');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'ব্যাচটি পাওয়া যায়নি' });
    }

    // Check if batch is archived or draft
    if (batch.status === 'archived') {
      return res.status(400).json({ success: false, message: 'এই ব্যাচে নতুন ভর্তি বন্ধ রয়েছে' });
    }

    const courseDoc = batch.courseId as any;
    const currentPriceAtEnrollment =
      courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0;

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      batchId,
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'enrolled' || existingEnrollment.status === 'completed') {
        return res.status(200).json({
          success: true,
          message: 'আপনি ইতিমধ্যে এই ব্যাচে এনরোল করা আছেন।',
          data: existingEnrollment,
        });
      }
      // If was cancelled or pending, reactivate to enrolled
      existingEnrollment.status = 'enrolled';
      existingEnrollment.enrolledAt = new Date();
      if (!existingEnrollment.batchFee) {
        existingEnrollment.batchFee = currentPriceAtEnrollment;
      }
      await existingEnrollment.save();

      return res.status(200).json({
        success: true,
        message: 'সফলভাবে ব্যাচে এনরোল সম্পন্ন হয়েছে!',
        data: existingEnrollment,
      });
    }

    // Check capacity if set
    if (batch.capacity && batch.capacity > 0) {
      const activeCount = await Enrollment.countDocuments({
        batchId,
        status: { $in: ['enrolled', 'completed'] },
      });
      if (activeCount >= batch.capacity) {
        return res.status(400).json({
          success: false,
          message: 'দুঃখিত, এই ব্যাচের আসন সংখ্যা পূর্ণ হয়ে গেছে।',
        });
      }
    }

    // Create Enrollment with batchFee snapshot
    const newEnrollment = await Enrollment.create({
      studentId,
      batchId,
      courseId: batch.courseId._id || batch.courseId,
      batchFee: currentPriceAtEnrollment,
      status: 'enrolled',
      enrolledAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'অভিনন্দন! সফলভাবে ব্যাচে ভর্তি সম্পন্ন হয়েছে।',
      data: newEnrollment,
    });
  } catch (error: any) {
    console.error('enrollInBatch error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'এনরোলমেন্ট সম্পন্ন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।',
    });
  }
};

/** Student submits an admission request. This never enrolls the student directly. */
export const createEnrollmentRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applicantUserId = req.user?._id;
    if (!applicantUserId || req.user?.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'শুধু শিক্ষার্থীরাই ভর্তি অনুরোধ করতে পারবেন।' });
    }

    const { batchId, name, phone, email, schoolOrCollege, gradeLevel, guardianName, guardianPhone, message } = req.body;
    const batch = await Batch.findById(batchId).populate('courseId', 'title slug gradeLevel subject courseFee regularPrice discountPrice');
    if (!batch) return res.status(404).json({ success: false, message: 'ব্যাচটি পাওয়া যায়নি।' });
    if (batch.status === 'archived') return res.status(400).json({ success: false, message: 'এই ব্যাচে নতুন ভর্তি বন্ধ আছে।' });

    const existingEnrollment = await Enrollment.findOne({
      studentId: applicantUserId,
      batchId: batch._id,
      status: { $in: ['enrolled', 'completed'] },
    });
    if (existingEnrollment) {
      return res.status(409).json({ success: false, message: 'আপনি ইতিমধ্যে এই ব্যাচে ভর্তি আছেন।' });
    }

    const existingRequest = await EnrollmentRequest.findOne({ applicantUserId, batchId: batch._id, status: 'pending' });
    if (existingRequest) {
      return res.status(409).json({ success: false, message: 'এই ব্যাচের জন্য আপনার একটি request আগে থেকেই pending আছে।', data: existingRequest });
    }

    const request = await EnrollmentRequest.create({
      applicantUserId,
      batchId: batch._id,
      courseId: (batch.courseId as any)._id || batch.courseId,
      name: name.trim(),
      phone: phone?.trim() || undefined,
      email: email?.trim().toLowerCase() || undefined,
      schoolOrCollege: schoolOrCollege?.trim() || undefined,
      gradeLevel: gradeLevel?.trim() || undefined,
      guardianName: guardianName?.trim() || undefined,
      guardianPhone: guardianPhone?.trim() || undefined,
      message: message?.trim() || undefined,
    });

    return res.status(201).json({ success: true, message: 'ভর্তি request সফলভাবে পাঠানো হয়েছে।', data: request });
  } catch (error: any) {
    console.error('createEnrollmentRequest error:', error);
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'এই ব্যাচের জন্য আপনার একটি request আগে থেকেই আছে।' });
    return res.status(500).json({ success: false, message: 'ভর্তি request পাঠানো যায়নি।' });
  }
};

export const getMyEnrollmentRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ success: false, message: 'Authentication required' });
    const requests = await EnrollmentRequest.find({ applicantUserId: req.user._id })
      .populate('batchId', 'name status')
      .populate('courseId', 'title gradeLevel')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'আপনার request তালিকা লোড করা যায়নি।' });
  }
};

export const getAdminEnrollmentRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
    const filter = status === 'all' ? {} : { status };
    const requests = await EnrollmentRequest.find(filter)
      .populate('applicantUserId', 'name userId email phone avatarUrl studentDetails')
      .populate({ path: 'batchId', select: 'name status capacity courseId', populate: { path: 'courseId', select: 'title gradeLevel' } })
      .populate('courseId', 'title gradeLevel')
      .populate('reviewedBy', 'name userId role')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error('getAdminEnrollmentRequests error:', error);
    return res.status(500).json({ success: false, message: 'ভর্তি request তালিকা লোড করা যায়নি।' });
  }
};

export const getEnrollmentRequestById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = await EnrollmentRequest.findById(req.params.requestId)
      .populate('applicantUserId', 'name userId email phone avatarUrl studentDetails')
      .populate({ path: 'batchId', select: 'name status capacity courseId', populate: { path: 'courseId', select: 'title gradeLevel' } })
      .populate('courseId', 'title gradeLevel')
      .lean();
    if (!request) return res.status(404).json({ success: false, message: 'Request পাওয়া যায়নি।' });
    return res.json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Request লোড করা যায়নি।' });
  }
};

/** Approves a request without recording a payment; payment can be collected later. */
export const approveEnrollmentRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewerId = req.user?._id;
    const request = await EnrollmentRequest.findOne({ _id: req.params.requestId, status: 'pending' }).populate('batchId').populate('courseId');
    if (!request) return res.status(404).json({ success: false, message: 'Pending request পাওয়া যায়নি।' });

    const batch: any = request.batchId;
    const course: any = request.courseId;
    if (!batch || batch.status === 'archived') return res.status(400).json({ success: false, message: 'এই ব্যাচে নতুন ভর্তি বন্ধ আছে।' });

    if (batch.capacity && batch.capacity > 0) {
      const activeCount = await Enrollment.countDocuments({ batchId: batch._id, status: { $in: ['enrolled', 'completed'] } });
      if (activeCount >= batch.capacity) return res.status(400).json({ success: false, message: 'এই ব্যাচের আসন পূর্ণ হয়ে গেছে।' });
    }

    const existing = await Enrollment.findOne({ studentId: request.applicantUserId, batchId: batch._id });
    const fee = course?.discountPrice ?? course?.courseFee ?? course?.regularPrice ?? 0;
    const enrollment = existing || await Enrollment.create({
      studentId: request.applicantUserId,
      batchId: batch._id,
      courseId: course?._id || request.courseId,
      batchFee: fee,
      status: 'enrolled',
      paymentFee: 0,
      paymentStatus: 'unpaid',
      enrolledBy: reviewerId,
      enrolledAt: new Date(),
      notes: 'Approved from student enrollment request',
    });

    if (existing) {
      existing.status = 'enrolled';
      existing.batchFee = existing.batchFee || fee;
      existing.paymentFee = existing.paymentFee || 0;
      existing.paymentStatus = existing.paymentStatus || 'unpaid';
      existing.enrolledBy = reviewerId;
      existing.enrolledAt = new Date();
      await existing.save();
    }

    request.status = 'approved';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.approvedEnrollmentId = enrollment._id;
    request.reviewNote = req.body?.reviewNote?.trim() || undefined;
    await request.save();

    return res.json({ success: true, message: 'Request approve করে শিক্ষার্থীকে ব্যাচে ভর্তি করা হয়েছে।', data: { request, enrollment } });
  } catch (error: any) {
    console.error('approveEnrollmentRequest error:', error);
    return res.status(500).json({ success: false, message: 'Request approve করা যায়নি।' });
  }
};

export const rejectEnrollmentRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = await EnrollmentRequest.findOne({ _id: req.params.requestId, status: 'pending' });
    if (!request) return res.status(404).json({ success: false, message: 'Pending request পাওয়া যায়নি।' });
    request.status = 'rejected';
    request.reviewedBy = req.user?._id;
    request.reviewedAt = new Date();
    request.reviewNote = req.body?.reviewNote?.trim() || 'Request rejected by admin';
    await request.save();
    return res.json({ success: true, message: 'Request reject করা হয়েছে।', data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Request reject করা যায়নি।' });
  }
};

/**
 * Get current user's enrollment status for a specific course or batch
 */
export const getMyEnrollmentStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?._id;
    const { courseId, batchId } = req.query;

    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const filter: any = {
      studentId,
      status: { $in: ['enrolled', 'completed'] },
    };

    if (batchId) {
      filter.batchId = batchId;
    } else if (courseId) {
      if (mongoose.Types.ObjectId.isValid(courseId as string)) {
        filter.courseId = courseId;
      } else {
        const course = await Course.findOne({ slug: courseId });
        if (course) {
          filter.courseId = course._id;
        } else {
          return res.status(200).json({ success: true, enrolledBatchIds: [] });
        }
      }
    }

    const enrollments = await Enrollment.find(filter).select('batchId courseId status enrolledAt');
    const enrolledBatchIds = enrollments.map((e) => e.batchId.toString());

    return res.status(200).json({
      success: true,
      enrolledBatchIds,
      enrollments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to check enrollment status' });
  }
};

/**
 * Get all Batches enrolled by the current student (for Student Dashboard)
 */
export const getMyBatches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Find active or completed enrollments
    const enrollments = await Enrollment.find({
      studentId,
      status: { $in: ['enrolled', 'completed'] },
    }).select('batchId');

    const enrolledBatchIds = enrollments.map((e) => e.batchId);

    if (enrolledBatchIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const batches = await Batch.find({ _id: { $in: enrolledBatchIds } })
      .populate('courseId', 'title slug gradeLevel subject')
      .populate('assignedTeachers', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    console.error('getMyBatches error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student enrolled batches' });
  }
};

/**
 * Admin Manual Admission: Admit/Enroll a student into a batch.
 * If new student: generates unique User ID (YYMMDD###) and sets password equal to User ID!
 */
export const adminAdmitStudent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত এক্সেস' });
    }

    const {
      name,
      phone,
      email,
      batchId,
      schoolOrCollege,
      gradeLevel,
      guardianName,
      guardianPhone,
      paymentFee = 0,
      paymentStatus = 'paid',
      paymentMethod = 'cash',
      transactionId = '',
      senderNumber = '',
      documentUrl = '',
      notes = '',
      existingStudentId,
      requestId,
    } = req.body;

    // Verify batch
    const batch = await Batch.findById(batchId).populate('courseId', 'title slug gradeLevel subject courseFee regularPrice discountPrice');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'নির্বাচিত ব্যাচটি পাওয়া যায়নি।' });
    }

    let studentDoc: any = null;
    let isNewUserCreated = false;
    let generatedUserId = '';
    let defaultPassword = '';

    // If an existing student was selected
    if (existingStudentId && mongoose.Types.ObjectId.isValid(existingStudentId)) {
      studentDoc = await User.findById(existingStudentId);
      if (!studentDoc) {
        return res.status(404).json({ success: false, message: 'বিদ্যমান শিক্ষার্থী পাওয়া যায়নি।' });
      }
      generatedUserId = studentDoc.userId;
    } else {
      // Check if student with email or phone already exists
      if (email && email.trim() !== '') {
        const found = await User.findOne({ email: email.trim().toLowerCase() });
        if (found) {
          studentDoc = found;
          generatedUserId = found.userId;
        }
      }

      if (!studentDoc && phone && phone.trim() !== '') {
        const found = await User.findOne({ phone: phone.trim() });
        if (found) {
          studentDoc = found;
          generatedUserId = found.userId;
        }
      }

      // If still not found, create new student account
      if (!studentDoc) {
        generatedUserId = await generateUniqueUserId();
        // The default password is EXACTLY the generated userId
        defaultPassword = generatedUserId;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        studentDoc = await User.create({
          userId: generatedUserId,
          name: name.trim(),
          email: email && email.trim() !== '' ? email.trim().toLowerCase() : undefined,
          phone: phone && phone.trim() !== '' ? phone.trim() : undefined,
          passwordHash,
          role: ROLES.STUDENT,
          status: 'active',
          emailVerified: !!email,
          studentDetails: {
            schoolOrCollege: schoolOrCollege || '',
            gradeLevel: gradeLevel || (batch.courseId as any)?.gradeLevel || '',
            guardianName: guardianName || '',
            guardianPhone: guardianPhone || '',
          },
        });
        isNewUserCreated = true;
      }
    }

    // Check if already enrolled in this batch
    const existingEnrollment = await Enrollment.findOne({
      studentId: studentDoc._id,
      batchId: batch._id,
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'enrolled' || existingEnrollment.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: `শিক্ষার্থী (${studentDoc.name} - আইডি: ${studentDoc.userId}) ইতিমধ্যে এই ব্যাচে ভর্তি আছেন।`,
          student: {
            _id: studentDoc._id,
            name: studentDoc.name,
            userId: studentDoc.userId,
            phone: studentDoc.phone,
            email: studentDoc.email,
          },
          enrollment: existingEnrollment,
        });
      }

      // Reactivate canceled/pending enrollment
      existingEnrollment.status = 'enrolled';
      existingEnrollment.paymentFee = Number(paymentFee) || 0;
      existingEnrollment.paymentStatus = paymentStatus;
      existingEnrollment.notes = notes || existingEnrollment.notes;
      existingEnrollment.enrolledBy = adminUser._id;
      existingEnrollment.enrolledAt = new Date();
      if (!existingEnrollment.batchFee) {
        const courseDoc = batch.courseId as any;
        existingEnrollment.batchFee =
          courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0;
      }
      await existingEnrollment.save();

      if (requestId && mongoose.Types.ObjectId.isValid(requestId)) {
        await EnrollmentRequest.findOneAndUpdate(
          { _id: requestId, status: 'pending' },
          { status: 'approved', reviewedBy: adminUser._id, reviewedAt: new Date(), approvedEnrollmentId: existingEnrollment._id, reviewNote: 'Approved through admin admission form' }
        );
      }

      let reactivatedPayment: any = null;
      try {
        const receiptNo = await generateReceiptNumber();
        const numericFee = Number(paymentFee) || 0;
        const courseDoc = batch.courseId as any;
        const courseTotalFee = existingEnrollment.batchFee || (courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0);
        const dueAmount = Math.max(0, courseTotalFee - numericFee);

        const newPay = await Payment.create({
          receiptNo,
          studentId: studentDoc._id,
          enrollmentId: existingEnrollment._id,
          batchId: batch._id,
          courseId: batch.courseId._id || batch.courseId,
          amountPaid: numericFee,
          totalFee: courseTotalFee,
          dueAmount,
          paymentMethod: paymentMethod || 'cash',
          paymentType: 'admission',
          transactionId: transactionId ? transactionId.trim() : '',
          senderNumber: senderNumber ? senderNumber.trim() : '',
          documentUrl: documentUrl ? documentUrl.trim() : '',
          status: 'completed',
          notes: notes ? notes.trim() : '',
          collectedBy: adminUser._id,
          paidAt: new Date(),
        });

        reactivatedPayment = await Payment.findById(newPay._id)
          .populate('studentId', 'name userId phone email avatarUrl studentDetails')
          .populate('batchId', 'name courseId')
          .populate('courseId', 'title')
          .populate('collectedBy', 'name userId role');
      } catch (payErr) {
        console.error('Failed to create Payment record on reactivation:', payErr);
      }

      return res.status(200).json({
        success: true,
        message: 'শিক্ষার্থীর ভর্তি স্ট্যাটাস সফলভাবে পুনরায় সক্রিয় করা হয়েছে!',
        isNewUserCreated,
        student: {
          _id: studentDoc._id,
          name: studentDoc.name,
          userId: studentDoc.userId,
          phone: studentDoc.phone,
          email: studentDoc.email,
          defaultPassword: isNewUserCreated ? defaultPassword : null,
        },
        batch: {
          _id: batch._id,
          name: batch.name,
          course: batch.courseId,
        },
        enrollment: existingEnrollment,
        payment: reactivatedPayment,
      });
    }

    const courseDoc = batch.courseId as any;
    const currentPriceAtEnrollment =
      courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0;

    // Create new Enrollment record
    const enrollment = await Enrollment.create({
      studentId: studentDoc._id,
      batchId: batch._id,
      courseId: batch.courseId._id || batch.courseId,
      batchFee: currentPriceAtEnrollment,
      status: 'enrolled',
      enrolledAt: new Date(),
      paymentFee: Number(paymentFee) || 0,
      paymentStatus: paymentStatus || 'paid',
      enrolledBy: adminUser._id,
      notes: notes || '',
    });

    if (requestId && mongoose.Types.ObjectId.isValid(requestId)) {
      await EnrollmentRequest.findOneAndUpdate(
        { _id: requestId, status: 'pending' },
        { status: 'approved', reviewedBy: adminUser._id, reviewedAt: new Date(), approvedEnrollmentId: enrollment._id, reviewNote: 'Approved through admin admission form' }
      );
    }

    // Create Payment record & Receipt if paymentFee > 0 or status is set
    let createdPayment: any = null;
    const numericFee = Number(paymentFee) || 0;
    const courseTotalFee = currentPriceAtEnrollment;
    const dueAmount = Math.max(0, courseTotalFee - numericFee);

    try {
      const receiptNo = await generateReceiptNumber();
      const newPay = await Payment.create({
        receiptNo,
        studentId: studentDoc._id,
        enrollmentId: enrollment._id,
        batchId: batch._id,
        courseId: batch.courseId._id || batch.courseId,
        amountPaid: numericFee,
        totalFee: courseTotalFee,
        dueAmount,
        paymentMethod: paymentMethod || 'cash',
        paymentType: 'admission',
        transactionId: transactionId ? transactionId.trim() : '',
        senderNumber: senderNumber ? senderNumber.trim() : '',
        documentUrl: documentUrl ? documentUrl.trim() : '',
        status: 'completed',
        notes: notes ? notes.trim() : '',
        collectedBy: adminUser._id,
        paidAt: new Date(),
      });

      createdPayment = await Payment.findById(newPay._id)
        .populate('studentId', 'name userId phone email avatarUrl studentDetails')
        .populate('batchId', 'name fee courseId')
        .populate('courseId', 'title')
        .populate('collectedBy', 'name userId role');
    } catch (payErr) {
      console.error('Failed to create initial Payment record:', payErr);
    }

    return res.status(201).json({
      success: true,
      message: 'অভিনন্দন! শিক্ষার্থীকে সফলভাবে ব্যাচে ভর্তি করানো হয়েছে।',
      isNewUserCreated,
      student: {
        _id: studentDoc._id,
        name: studentDoc.name,
        userId: studentDoc.userId,
        phone: studentDoc.phone,
        email: studentDoc.email,
        defaultPassword: isNewUserCreated ? defaultPassword : null,
      },
      batch: {
        _id: batch._id,
        name: batch.name,
        course: batch.courseId,
      },
      enrollment,
      payment: createdPayment,
    });
  } catch (error: any) {
    console.error('adminAdmitStudent error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'ভর্তি প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।',
    });
  }
};

/**
 * Get all admissions / enrollments for Admin view with search and filter
 */
export const getAdminEnrollments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId, courseId, search, status, paymentStatus, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (batchId && mongoose.Types.ObjectId.isValid(batchId as string)) {
      filter.batchId = batchId;
    }

    if (courseId && mongoose.Types.ObjectId.isValid(courseId as string)) {
      filter.courseId = courseId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // If search keyword provided, find matching student IDs
    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      const matchingStudents = await User.find({
        $or: [{ name: regex }, { userId: regex }, { phone: regex }, { email: regex }],
      }).select('_id');
      const studentIds = matchingStudents.map((s) => s._id);
      filter.studentId = { $in: studentIds };
    }

    const total = await Enrollment.countDocuments(filter);

    const enrollments = await Enrollment.find(filter)
      .populate('studentId', 'name userId email phone avatarUrl studentDetails')
      .populate('batchId', 'name fee capacity status')
      .populate('courseId', 'title slug gradeLevel subject')
      .populate('enrolledBy', 'name userId role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: enrollments,
    });
  } catch (error: any) {
    console.error('getAdminEnrollments error:', error);
    return res.status(500).json({
      success: false,
      message: 'ভর্তি তালিকা লোড করা সম্ভব হয়নি।',
    });
  }
};

/**
 * Admin action to remove/cancel student enrollment from a batch/course.
 * Supports either enrollmentId (in params) OR { batchId, studentId } in body/query.
 * Rule 1: "আমি যদি ক্লাস রুম থেকে রিমুভ করে দেই ওর ওই ব্যাচের যেই ট্রানজেকশনগুলো করছিল টাকা পয়সা রিলেটেড সেগুলো ডিলিট হয়ে যাবে এবং ফাইন্যান্সও নতুন করে আপডেট হবে"
 */
export const removeStudentFromBatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' });
    }

    const { enrollmentId } = req.params;
    const { batchId, studentId, reason } = req.body || {};

    let enrollment = null;

    if (enrollmentId && mongoose.Types.ObjectId.isValid(enrollmentId)) {
      enrollment = await Enrollment.findById(enrollmentId);
    } else if (batchId && studentId) {
      enrollment = await Enrollment.findOne({
        batchId,
        studentId,
        status: { $in: ['enrolled', 'completed', 'pending'] },
      });
    }

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'কোনো সক্রিয় এনরোলমেন্ট বা ভর্তি রেকর্ড পাওয়া যায়নি।',
      });
    }

    const prevStatus = enrollment.status;
    const targetStudentId = enrollment.studentId;
    const targetBatchId = enrollment.batchId;

    // 1. Delete all transactions/payments associated with this student and batch
    const deletePaymentResult = await Payment.deleteMany({
      studentId: targetStudentId,
      batchId: targetBatchId,
    });

    // 2. Mark enrollment as cancelled (or delete enrollment record)
    enrollment.status = 'cancelled';
    enrollment.paymentFee = 0;
    enrollment.notes = enrollment.notes
      ? `${enrollment.notes} | Removed & deleted payments (${deletePaymentResult.deletedCount} transactions) by Admin ${adminUser.name} on ${new Date().toISOString()}: ${reason || 'Removed from batch'}`
      : `Removed & deleted payments (${deletePaymentResult.deletedCount} transactions) by Admin ${adminUser.name} on ${new Date().toISOString()}: ${reason || 'Removed from batch'}`;

    await enrollment.save();

    // Decrement batch currentStudents count
    await Batch.findByIdAndUpdate(targetBatchId, {
      $inc: { currentStudents: -1 },
    });

    return res.status(200).json({
      success: true,
      message: 'শিক্ষার্থীকে ব্যাচ থেকে রিমুভ করা হয়েছে এবং সংশ্লিষ্ট ট্রানজ্যাকশনগুলো মুছে ফাইন্যান্স আপডেট করা হয়েছে।',
      data: {
        enrollmentId: enrollment._id,
        deletedTransactionsCount: deletePaymentResult.deletedCount,
        previousStatus: prevStatus,
        status: enrollment.status,
      },
    });
  } catch (error: any) {
    console.error('removeStudentFromBatch error:', error);
    return res.status(500).json({
      success: false,
      message: 'শিক্ষার্থীকে রিমুভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
    });
  }
};

/**
 * Admin action to SHIFT a student to another batch (same course or different course).
 * Rule 1:
 * - Admin can shift student to a different batch in the same course OR to a batch in a new course.
 * - When shifted, the new batchFee is set to the current price of target course (discountPrice ?? courseFee ?? regularPrice).
 * - Existing payments are linked to the new batch and course, ensuring continuity while financial due recalculates with new batchFee.
 * - Batch student counts for both old and new batches are updated.
 */
export const shiftStudentBatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' });
    }

    const { enrollmentId, studentId, currentBatchId, targetBatchId, targetCourseId, reason } = req.body || {};

    let enrollment = null;
    if (enrollmentId && mongoose.Types.ObjectId.isValid(enrollmentId)) {
      enrollment = await Enrollment.findById(enrollmentId);
    } else if (studentId && currentBatchId) {
      enrollment = await Enrollment.findOne({
        studentId,
        batchId: currentBatchId,
        status: { $in: ['enrolled', 'completed', 'pending'] },
      });
    }

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'শিক্ষার্থীর বর্তমান কোনো সক্রিয় ভর্তি রেকর্ড পাওয়া যায়নি।',
      });
    }

    if (!targetBatchId) {
      return res.status(400).json({
        success: false,
        message: 'শিফট করার জন্য নতুন ব্যাচ নির্ধারণ করা আবশ্যক।',
      });
    }

    const targetBatch = await Batch.findById(targetBatchId).populate('courseId');
    if (!targetBatch) {
      return res.status(404).json({
        success: false,
        message: 'উদ্দিষ্ট নতুন ব্যাচ খুঁজে পাওয়া যায়নি।',
      });
    }

    const targetCourse = (targetBatch.courseId as any) || (await Course.findById(targetBatch.courseId));
    if (!targetCourse) {
      return res.status(404).json({
        success: false,
        message: 'উদ্দিষ্ট ব্যাচের কোর্স তথ্য পাওয়া যায়নি।',
      });
    }

    // Determine current live price of target course at the moment of shift
    const currentTargetCourseFee =
      targetCourse.discountPrice !== undefined && targetCourse.discountPrice !== null
        ? targetCourse.discountPrice
        : targetCourse.courseFee !== undefined && targetCourse.courseFee !== null
        ? targetCourse.courseFee
        : targetCourse.regularPrice || 0;

    const oldBatchId = enrollment.batchId;
    const oldCourseId = enrollment.courseId;
    const studentObjectId = enrollment.studentId;

    // Check if student is already enrolled in targetBatch
    if (oldBatchId.toString() === targetBatch._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'শিক্ষার্থী ইতিমধ্যেই এই ব্যাচে ভর্তি আছে।',
      });
    }

    // Update enrollment with new batch, course and snapshot of current fee
    enrollment.batchId = targetBatch._id;
    enrollment.courseId = targetCourse._id;
    enrollment.batchFee = currentTargetCourseFee;
    enrollment.notes = enrollment.notes
      ? `${enrollment.notes} | Shifted from Batch ${oldBatchId} to ${targetBatch.name} by Admin ${adminUser.name} on ${new Date().toISOString()}: ${reason || 'Batch shifted'}`
      : `Shifted from Batch ${oldBatchId} to ${targetBatch.name} by Admin ${adminUser.name} on ${new Date().toISOString()}: ${reason || 'Batch shifted'}`;

    await enrollment.save();

    // Re-link previous completed payments for this enrollment to the new batch and course
    await Payment.updateMany(
      { studentId: studentObjectId, batchId: oldBatchId },
      {
        $set: {
          batchId: targetBatch._id,
          courseId: targetCourse._id,
          totalFee: currentTargetCourseFee,
        },
      }
    );

    // Update batch capacities
    await Batch.findByIdAndUpdate(oldBatchId, { $inc: { currentStudents: -1 } });
    await Batch.findByIdAndUpdate(targetBatch._id, { $inc: { currentStudents: 1 } });

    return res.status(200).json({
      success: true,
      message: `শিক্ষার্থীকে সফলভাবে "${targetBatch.name}" (${targetCourse.title}) ব্যাচে শিফট করা হয়েছে। নতুন ব্যাচ ফি: ৳${currentTargetCourseFee.toLocaleString('bn-BD')}`,
      data: {
        enrollmentId: enrollment._id,
        newBatchId: targetBatch._id,
        newBatchName: targetBatch.name,
        newCourseId: targetCourse._id,
        newCourseTitle: targetCourse.title,
        newBatchFee: currentTargetCourseFee,
      },
    });
  } catch (error: any) {
    console.error('shiftStudentBatch error:', error);
    return res.status(500).json({
      success: false,
      message: 'ব্যাচ পরিবর্তন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
    });
  }
};


