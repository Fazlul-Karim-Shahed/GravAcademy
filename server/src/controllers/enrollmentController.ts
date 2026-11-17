import { Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { z } from 'zod';
import { Enrollment } from '../models/Enrollment';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { AuthenticatedRequest } from '../middleware/auth';

import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Payment } from '../models/Payment';
import { EnrollmentRequest } from '../models/EnrollmentRequest';
import { EmailVerificationToken } from '../models/EmailVerificationToken';
import { generateUniquegravId } from './authController';
import { generateReceiptNumber } from './financeController';
import { ROLES } from '../types/roles';
import {
  sendEnrollmentApprovalEmail,
  sendEnrollmentRequestReceivedEmail,
  sendWelcomeRegistrationEmail,
  isDisposableEmail,
  hasValidMxRecords,
} from '../services/emailService';
import { createEmailVerification } from '../services/emailVerification';
import { getStudentAccessExpiresAt, hasActiveStudentBatchAccess } from '../services/batchAccessService';

const findActiveEnrollmentInAnotherBatchOfCourse = (
  gravId: string,
  courseId: mongoose.Types.ObjectId | string,
  batchId: mongoose.Types.ObjectId | string
) => Enrollment.findOne({
  gravId,
  courseId,
  batchId: { $ne: batchId },
  status: { $in: ['enrolled', 'completed'] },
}).populate('batchId', 'name').lean();

const alreadyEnrolledInCourseMessage = (batchName?: string) =>
  `এই student ইতিমধ্যে এই course-এর ${batchName ? `“${batchName}”` : 'অন্য একটি batch'}-এ enrolled আছেন।`;

export const enrollBatchSchema = z.object({
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Batch ID'),
});

export const createEnrollmentRequestSchema = z.object({
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Batch ID'),
  name: z.string().min(2).max(120),
  phone: z.string().trim().min(1, 'মোবাইল নম্বর দিন').max(30),
  email: z.string().email().optional().or(z.literal('')),
  schoolOrCollege: z.string().max(160).optional().or(z.literal('')),
  gradeLevel: z.string().max(80).optional().or(z.literal('')),
  guardianName: z.string().max(120).optional().or(z.literal('')),
  guardianPhone: z.string().max(30).optional().or(z.literal('')),
  message: z.string().max(500).optional().or(z.literal('')),
});

export const adminAdmitStudentSchema = z.object({
  name: z.string().min(2, 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦° à¦¨à¦¾à¦® à¦†à¦¬à¦¶à§à¦¯à¦•'),
  phone: z.string().trim().min(1, 'মোবাইল নম্বর দিন'),
  email: z.string().email('à¦¸à¦ à¦¿à¦• à¦‡à¦®à§‡à¦‡à¦² à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦¦à¦¿à¦¨').optional().or(z.literal('')),
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'à¦­à§à¦² à¦¬à§à¦¯à¦¾à¦š à¦†à¦‡à¦¡à¦¿'),
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
      existingGravId: z.string().optional().or(z.literal('')), // existing student's public Grav ID
  requestId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().or(z.literal('')),
});

/**
 * Enroll Current Student into a Batch
 */
export const enrollInBatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.body;
    const gravId = req.user?.gravId;
    const userRole = req.user?.role;

    if (!gravId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'à¦¶à§à¦§à§à¦®à¦¾à¦¤à§à¦° à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦¦à§‡à¦° à¦œà¦¨à§à¦¯ à¦à¦¨à¦°à§‹à¦²à¦®à§‡à¦¨à§à¦Ÿ à¦‰à¦¨à§à¦®à§à¦•à§à¦¤à¥¤',
      });
    }

    const batch = await Batch.findById(batchId).populate('courseId', 'courseFee regularPrice discountPrice');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'à¦¬à§à¦¯à¦¾à¦šà¦Ÿà¦¿ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿' });
    }

    // Check if batch is archived or draft
    if (batch.status === 'archived') {
      return res.status(400).json({ success: false, message: 'à¦à¦‡ à¦¬à§à¦¯à¦¾à¦šà§‡ à¦¨à¦¤à§à¦¨ à¦­à¦°à§à¦¤à¦¿ à¦¬à¦¨à§à¦§ à¦°à§Ÿà§‡à¦›à§‡' });
    }

    const courseDoc = batch.courseId as any;
    const currentPriceAtEnrollment =
      courseDoc?.discountPrice ?? courseDoc?.courseFee ?? courseDoc?.regularPrice ?? 0;

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      gravId,
      batchId,
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'enrolled' || existingEnrollment.status === 'completed') {
        return res.status(200).json({
          success: true,
          message: 'আপনি ইতিমধ্যে এই batch-এ enrolled আছেন।',
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
        message: 'à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¬à§à¦¯à¦¾à¦šà§‡ à¦à¦¨à¦°à§‹à¦² à¦¸à¦®à§à¦ªà¦¨à§à¦¨ à¦¹à§Ÿà§‡à¦›à§‡!',
        data: existingEnrollment,
      });
    }

    const courseEnrollment = await findActiveEnrollmentInAnotherBatchOfCourse(
      gravId,
      (batch.courseId as any)._id || batch.courseId,
      batch._id
    );
    if (courseEnrollment) {
      return res.status(409).json({
        success: false,
        message: alreadyEnrolledInCourseMessage((courseEnrollment.batchId as any)?.name),
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
          message: 'à¦¦à§à¦ƒà¦–à¦¿à¦¤, à¦à¦‡ à¦¬à§à¦¯à¦¾à¦šà§‡à¦° à¦†à¦¸à¦¨ à¦¸à¦‚à¦–à§à¦¯à¦¾ à¦ªà§‚à¦°à§à¦£ à¦¹à§Ÿà§‡ à¦—à§‡à¦›à§‡à¥¤',
        });
      }
    }

    // Create Enrollment with batchFee snapshot
    const newEnrollment = await Enrollment.create({
      gravId,
      batchId,
      courseId: batch.courseId._id || batch.courseId,
      batchFee: currentPriceAtEnrollment,
      status: 'enrolled',
      enrolledAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'à¦…à¦­à¦¿à¦¨à¦¨à§à¦¦à¦¨! à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¬à§à¦¯à¦¾à¦šà§‡ à¦­à¦°à§à¦¤à¦¿ à¦¸à¦®à§à¦ªà¦¨à§à¦¨ à¦¹à§Ÿà§‡à¦›à§‡à¥¤',
      data: newEnrollment,
    });
  } catch (error: any) {
    console.error('enrollInBatch error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'à¦à¦¨à¦°à§‹à¦²à¦®à§‡à¦¨à§à¦Ÿ à¦¸à¦®à§à¦ªà¦¨à§à¦¨ à¦•à¦°à¦¾ à¦¸à¦®à§à¦­à¦¬ à¦¹à§Ÿà¦¨à¦¿à¥¤ à¦ªà§à¦¨à¦°à¦¾à§Ÿ à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤',
    });
  }
};

/** A student or guest submits an admission request. This never enrolls directly. */
export const createEnrollmentRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user && req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'à¦¶à§à¦§à§ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦…à¦¥à¦¬à¦¾ guest user à¦­à¦°à§à¦¤à¦¿ à¦…à¦¨à§à¦°à§‹à¦§ à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡à¦¨à¥¤' });
    }

    const { batchId, name, phone, email, schoolOrCollege, gradeLevel, guardianName, guardianPhone, message } = req.body;
    const isGuest = !req.user;
    const applicantGravId = req.user?.gravId;
    const batch = await Batch.findById(batchId).populate('courseId', 'title slug gradeLevel subject courseFee regularPrice discountPrice');
    if (!batch) return res.status(404).json({ success: false, message: 'à¦¬à§à¦¯à¦¾à¦šà¦Ÿà¦¿ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
    if (batch.status === 'archived') return res.status(400).json({ success: false, message: 'à¦à¦‡ à¦¬à§à¦¯à¦¾à¦šà§‡ à¦¨à¦¤à§à¦¨ à¦­à¦°à§à¦¤à¦¿ à¦¬à¦¨à§à¦§ à¦†à¦›à§‡à¥¤' });
    const fixedGradeLevel = String((batch.courseId as any)?.gradeLevel || '').trim();
    if (fixedGradeLevel && gradeLevel?.trim() && gradeLevel.trim() !== fixedGradeLevel) {
      return res.status(400).json({ success: false, message: 'à¦à¦‡ batch-à¦à¦° à¦¨à¦¿à¦°à§à¦§à¦¾à¦°à¦¿à¦¤ à¦¶à§à¦°à§‡à¦£à¦¿ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¾ à¦¯à¦¾à¦¬à§‡ à¦¨à¦¾à¥¤' });
    }

    const contactFilters = [
      ...(email?.trim() ? [{ email: email.trim().toLowerCase() }] : []),
      ...(phone?.trim() ? [{ phone: phone.trim() }] : []),
    ];
    const existingUser = isGuest
      ? await User.findOne({ role: ROLES.STUDENT, $or: contactFilters })
      : req.user;
    const existingEnrollment = existingUser
      ? await Enrollment.findOne({
          gravId: existingUser.gravId,
          batchId: batch._id,
          status: { $in: ['enrolled', 'completed'] },
        })
      : null;
    if (existingEnrollment) {
      return res.status(409).json({ success: false, message: 'আপনি ইতিমধ্যে এই batch-এ enrolled আছেন।' });
    }

    const courseEnrollment = existingUser && (batch.courseId as any)?._id
      ? await findActiveEnrollmentInAnotherBatchOfCourse(existingUser.gravId, (batch.courseId as any)._id, batch._id)
      : null;
    if (courseEnrollment) {
      return res.status(409).json({
        success: false,
        message: alreadyEnrolledInCourseMessage((courseEnrollment.batchId as any)?.name),
      });
    }

    const existingRequest = isGuest
      ? await EnrollmentRequest.findOne({ batchId: batch._id, status: { $in: ['pending', 'verification_pending'] }, $or: contactFilters })
      : await EnrollmentRequest.findOne({ applicantGravId, batchId: batch._id, status: 'pending' });
    if (existingRequest) {
      return res.status(409).json({ success: false, message: 'à¦à¦‡ à¦¬à§à¦¯à¦¾à¦šà§‡à¦° à¦œà¦¨à§à¦¯ à¦†à¦ªà¦¨à¦¾à¦° à¦à¦•à¦Ÿà¦¿ request à¦†à¦—à§‡ à¦¥à§‡à¦•à§‡à¦‡ pending à¦†à¦›à§‡à¥¤', data: existingRequest });
    }

    if (isGuest) {
      const normalizedEmail = email?.trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ success: false, message: 'ভর্তি রিকোয়েস্টের জন্য একটি সক্রিয় ইমেইল ঠিকানা দিন।' });
      }

      // Check disposable
      if (isDisposableEmail(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'অনুগ্রহ করে একটি স্থায়ী ও ভ্যালিড ব্যক্তিগত ইমেইল ব্যবহার করুন (টেম্পোরারি ইমেইল অনুমোদিত নয়)।',
        });
      }

      // Check DNS MX
      const hasMx = await hasValidMxRecords(normalizedEmail);
      if (!hasMx) {
        return res.status(400).json({
          success: false,
          message: 'ইমেইল ডোমেইনটি সক্রিয় বা সঠিক নয়। অনুগ্রহ করে আপনার সঠিক ইমেইল এড্রেস লিখুন।',
        });
      }

    }

    const request = await EnrollmentRequest.create({
      applicantGravId,
      isGuest,
      batchId: batch._id,
      courseId: (batch.courseId as any)._id || batch.courseId,
      name: name.trim(),
      phone: phone?.trim() || undefined,
      email: email?.trim().toLowerCase() || undefined,
      schoolOrCollege: schoolOrCollege?.trim() || undefined,
      gradeLevel: fixedGradeLevel || gradeLevel?.trim() || undefined,
      guardianName: guardianName?.trim() || undefined,
      guardianPhone: guardianPhone?.trim() || undefined,
      message: message?.trim() || undefined,
      status: 'pending',
    });

    if (isGuest) {
      const normalizedEmail = email.trim().toLowerCase();
      const emailSent = await sendEnrollmentRequestReceivedEmail({
        to: normalizedEmail,
        name: name.trim(),
        batchName: batch.name,
      });
      if (!emailSent) {
        await EnrollmentRequest.deleteOne({ _id: request._id });
        return res.status(400).json({ success: false, message: 'এই ইমেইলে request confirmation পাঠানো যায়নি। ইমেইলটি যাচাই করে আবার চেষ্টা করুন।' });
      }
    }

    return res.status(201).json({
      success: true,
      message: isGuest
        ? 'আপনার request admin-এর কাছে পাঠানো হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সঙ্গে যোগাযোগ করবে।'
        : 'ভর্তি request সফলভাবে পাঠানো হয়েছে।',
      data: request,
    });
  } catch (error: any) {
    console.error('createEnrollmentRequest error:', error);
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'à¦à¦‡ à¦¬à§à¦¯à¦¾à¦šà§‡à¦° à¦œà¦¨à§à¦¯ à¦†à¦ªà¦¨à¦¾à¦° à¦à¦•à¦Ÿà¦¿ request à¦†à¦—à§‡ à¦¥à§‡à¦•à§‡à¦‡ à¦†à¦›à§‡à¥¤' });
    return res.status(500).json({ success: false, message: 'à¦­à¦°à§à¦¤à¦¿ request à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
  }
};

export const getMyEnrollmentRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ success: false, message: 'Authentication required' });
    const requests = await EnrollmentRequest.find({ applicantGravId: req.user.gravId })
      .populate('batchId', 'name status')
      .populate('courseId', 'title gradeLevel')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'à¦†à¦ªà¦¨à¦¾à¦° request à¦¤à¦¾à¦²à¦¿à¦•à¦¾ à¦²à§‹à¦¡ à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
  }
};

export const getAdminEnrollmentRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
    const filter = status === 'all' ? {} : { status };
    const requests = await EnrollmentRequest.find(filter)
      .populate({ path: 'batchId', select: 'name status capacity courseId', populate: { path: 'courseId', select: 'title gradeLevel' } })
      .populate('courseId', 'title gradeLevel')
      .populate('reviewedBy', 'name gravId role')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const applicantGravIds = requests.map((request) => request.applicantGravId).filter(Boolean) as string[];
    const applicants = await User.find({ gravId: { $in: applicantGravIds }, role: ROLES.STUDENT })
      .select('name gravId phone email avatarUrl studentDetails')
      .lean();
    const applicantMap = new Map(applicants.map((applicant) => [applicant.gravId, applicant]));
    const enrichedRequests = requests.map((request) => ({
      ...request,
      applicant: request.applicantGravId ? applicantMap.get(request.applicantGravId) || null : null,
    }));
    return res.json({ success: true, count: enrichedRequests.length, data: enrichedRequests });
  } catch (error) {
    console.error('getAdminEnrollmentRequests error:', error);
    return res.status(500).json({ success: false, message: 'à¦­à¦°à§à¦¤à¦¿ request à¦¤à¦¾à¦²à¦¿à¦•à¦¾ à¦²à§‹à¦¡ à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
  }
};

export const getEnrollmentRequestById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = await EnrollmentRequest.findById(req.params.requestId)
      .populate({ path: 'batchId', select: 'name status capacity courseId', populate: { path: 'courseId', select: 'title gradeLevel' } })
      .populate('courseId', 'title gradeLevel')
      .lean();
    if (!request) return res.status(404).json({ success: false, message: 'Request à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
    const applicant = request.applicantGravId
      ? await User.findOne({ gravId: request.applicantGravId, role: ROLES.STUDENT })
        .select('name gravId phone email avatarUrl studentDetails')
        .lean()
      : null;
    return res.json({ success: true, data: { ...request, applicant } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Request à¦²à§‹à¦¡ à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
  }
};

/** Approves a request, reusing an existing student or creating a new account for a guest. */
export const approveEnrollmentRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewerId = req.user?._id;
    const request = await EnrollmentRequest.findOne({ _id: req.params.requestId, status: 'pending' }).populate('batchId').populate('courseId');
    if (!request) return res.status(404).json({ success: false, message: 'Pending request à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });

    const batch: any = request.batchId;
    const course: any = request.courseId;
    if (!batch || batch.status === 'archived') return res.status(400).json({ success: false, message: 'à¦à¦‡ à¦¬à§à¦¯à¦¾à¦šà§‡ à¦¨à¦¤à§à¦¨ à¦­à¦°à§à¦¤à¦¿ à¦¬à¦¨à§à¦§ à¦†à¦›à§‡à¥¤' });

    if (batch.capacity && batch.capacity > 0) {
      const activeCount = await Enrollment.countDocuments({ batchId: batch._id, status: { $in: ['enrolled', 'completed'] } });
      if (activeCount >= batch.capacity) return res.status(400).json({ success: false, message: 'à¦à¦‡ à¦¬à§à¦¯à¦¾à¦šà§‡à¦° à¦†à¦¸à¦¨ à¦ªà§‚à¦°à§à¦£ à¦¹à§Ÿà§‡ à¦—à§‡à¦›à§‡à¥¤' });
    }

    const contactFilters = [
      ...(request.email?.trim() ? [{ email: request.email.trim().toLowerCase() }] : []),
      ...(request.phone?.trim() ? [{ phone: request.phone.trim() }] : []),
    ];
    let studentDoc = request.isGuest || !request.applicantGravId
      ? null
      : await User.findOne({ gravId: request.applicantGravId });
    if (!studentDoc && contactFilters.length > 0) {
      studentDoc = await User.findOne({ $or: contactFilters });
    }
    if (studentDoc && studentDoc.role !== ROLES.STUDENT) {
      return res.status(409).json({ success: false, message: 'à¦à¦‡ email à¦¬à¦¾ mobile à¦¨à¦®à§à¦¬à¦°à¦Ÿà¦¿ student account-à¦à¦° à¦¨à§Ÿà¥¤' });
    }

    let isNewUserCreated = false;
    let defaultPassword = '';
    if (!studentDoc) {
      const normalizedEmail = request.email ? request.email.trim().toLowerCase() : '';
      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: 'নতুন শিক্ষার্থী হিসেবে ভর্তি অনুমোদন করতে একটি ভ্যালিড ইমেইল প্রয়োজন।',
        });
      }

      if (isDisposableEmail(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'শিক্ষার্থীর ইমেইলটি টেম্পোরারি/ডিসপোজেবল, স্থায়ী ইমেইল ছাড়া অ্যাকাউন্ট তৈরি সম্ভব নয়।',
        });
      }

      const hasMx = await hasValidMxRecords(normalizedEmail);
      if (!hasMx) {
        return res.status(400).json({
          success: false,
          message: 'শিক্ষার্থীর ইমেইল ডোমেইনটি সক্রিয় বা সঠিক নয়।',
        });
      }

      const generatedgravId = await generateUniquegravId();
      defaultPassword = generatedgravId;

      // Send Welcome & Credential Email BEFORE saving student to DB
      const emailSent = await sendWelcomeRegistrationEmail({
        to: normalizedEmail,
        name: request.name.trim(),
        gravId: generatedgravId,
        role: 'student',
        password: defaultPassword,
        batchName: batch.name,
      });

      if (!emailSent) {
        return res.status(400).json({
          success: false,
          message: 'শিক্ষার্থীর ইমেইল ঠিকানায় ওয়েলকাম বা ক্রেডেনশিয়াল ইমেইল পাঠানো সম্ভব হয়নি। অনুগ্রহ করে ইমেইলটি যাচাই করুন।',
        });
      }

      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      studentDoc = await User.create({
        gravId: generatedgravId,
        name: request.name.trim(),
        email: normalizedEmail,
        phone: request.phone?.trim() || undefined,
        passwordHash,
        role: ROLES.STUDENT,
        status: 'active',
        emailVerified: true,
        studentDetails: {
          schoolOrCollege: request.schoolOrCollege || '',
          gradeLevel: request.gradeLevel || course?.gradeLevel || '',
          guardianName: request.guardianName || '',
          guardianPhone: request.guardianPhone || '',
        },
      });
      isNewUserCreated = true;
    }

    const existing = await Enrollment.findOne({ gravId: studentDoc.gravId, batchId: batch._id });
    const fee = course?.discountPrice ?? course?.courseFee ?? course?.regularPrice ?? 0;
    if (existing && ['enrolled', 'completed'].includes(existing.status)) {
      return res.status(409).json({ success: false, message: 'এই student ইতিমধ্যে এই batch-এ enrolled আছেন।' });
    }

    const courseEnrollment = await findActiveEnrollmentInAnotherBatchOfCourse(
      studentDoc.gravId,
      course?._id || request.courseId,
      batch._id
    );
    if (courseEnrollment) {
      return res.status(409).json({
        success: false,
        message: alreadyEnrolledInCourseMessage((courseEnrollment.batchId as any)?.name),
      });
    }

    const enrollment = existing || await Enrollment.create({
      gravId: studentDoc.gravId,
      batchId: batch._id,
      courseId: course?._id || request.courseId,
      batchFee: fee,
      status: 'enrolled',
      paymentFee: 0,
      paymentStatus: 'unpaid',
      enrolledBy: reviewerId,
      enrolledAt: new Date(),
      notes: 'Approved from enrollment request',
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

    request.applicantGravId = studentDoc.gravId;
    request.isGuest = false;
    request.status = 'approved';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.approvedEnrollmentId = enrollment._id;
    request.reviewNote = req.body?.reviewNote?.trim() || undefined;
    await request.save();

    let emailSent = false;
    if (request.email) {
      emailSent = await sendEnrollmentApprovalEmail({
        to: request.email,
        name: studentDoc.name,
        batchName: batch.name,
        gravId: studentDoc.gravId,
        password: isNewUserCreated ? defaultPassword : undefined,
        existingAccount: !isNewUserCreated,
      });
    }

    return res.json({
      success: true,
      message: isNewUserCreated
        ? 'Request approve à¦•à¦°à§‡ à¦¨à¦¤à§à¦¨ student account à¦¤à§ˆà¦°à¦¿ à¦“ batch-à¦ à¦­à¦°à§à¦¤à¦¿ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤'
        : 'Request approve à¦•à¦°à§‡ student-à¦•à§‡ batch-à¦ à¦­à¦°à§à¦¤à¦¿ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤',
      data: {
        request,
        enrollment,
        emailSent,
        isNewUserCreated,
        student: {
          _id: studentDoc._id,
          name: studentDoc.name,
          gravId: studentDoc.gravId,
          email: studentDoc.email,
          phone: studentDoc.phone,
          defaultPassword: isNewUserCreated ? defaultPassword : undefined,
        },
      },
    });
  } catch (error: any) {
    console.error('approveEnrollmentRequest error:', error);
    return res.status(500).json({ success: false, message: 'Request approve à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
  }
};

export const rejectEnrollmentRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = await EnrollmentRequest.findOne({ _id: req.params.requestId, status: 'pending' });
    if (!request) return res.status(404).json({ success: false, message: 'Pending request à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
    request.status = 'rejected';
    request.reviewedBy = req.user?._id;
    request.reviewedAt = new Date();
    request.reviewNote = req.body?.reviewNote?.trim() || 'Request rejected by admin';
    await request.save();
    return res.json({ success: true, message: 'Request reject à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤', data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Request reject à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
  }
};

/**
 * Get current user's enrollment status for a specific course or batch
 */
export const getMyEnrollmentStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const gravId = req.user?.gravId;
    const { courseId, batchId } = req.query;

    if (!gravId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const filter: any = {
      gravId,
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

    const candidateEnrollments = await Enrollment.find(filter).select('batchId courseId status enrolledAt');
    const enrolledBatches = await Batch.find({ _id: { $in: candidateEnrollments.map((item) => item.batchId) } }).select('_id endDate courseId').populate('courseId', 'studentAccessMode studentAccessMonths').lean();
    const batchById = new Map(enrolledBatches.map((batch) => [batch._id.toString(), batch]));
    const enrollments = candidateEnrollments.filter((enrollment) => {
      const batch = batchById.get(enrollment.batchId.toString());
      return !!batch && !!batch.courseId && hasActiveStudentBatchAccess(batch as any, enrollment, batch.courseId as any);
    });
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
    const gravId = req.user?.gravId;
    if (!gravId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Find active or completed enrollments
    const enrollments = await Enrollment.find({
      gravId,
      status: { $in: ['enrolled', 'completed'] },
    }).select('batchId enrolledAt');

    const enrolledBatches = await Batch.find({ _id: { $in: enrollments.map((item) => item.batchId) } }).select('_id endDate courseId').populate('courseId', 'studentAccessMode studentAccessMonths').lean();
    const batchById = new Map(enrolledBatches.map((batch) => [batch._id.toString(), batch]));
    const activeEnrollments = enrollments.filter((enrollment) => {
      const batch = batchById.get(enrollment.batchId.toString());
      return !!batch && !!batch.courseId && hasActiveStudentBatchAccess(batch as any, enrollment, batch.courseId as any);
    });

    const enrolledBatchIds = activeEnrollments.map((e) => e.batchId);

    if (enrolledBatchIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const batches = await Batch.find({ _id: { $in: enrolledBatchIds } })
      .populate('courseId', 'title slug gradeLevel subject')
      .populate('assignedTeachers', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    const expiryByBatchId = new Map(activeEnrollments.map((enrollment) => {
      const batch = batchById.get(enrollment.batchId.toString());
      return [enrollment.batchId.toString(), batch?.courseId ? getStudentAccessExpiresAt(batch as any, enrollment, batch.courseId as any) : null] as const;
    }));
    const batchesWithAccess = batches.map((batch) => ({
      ...batch,
      studentAccessExpiresAt: expiryByBatchId.get(batch._id.toString()) || null,
    }));

    return res.status(200).json({
      success: true,
      count: batchesWithAccess.length,
      data: batchesWithAccess,
    });
  } catch (error) {
    console.error('getMyBatches error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student enrolled batches' });
  }
};

/**
 * Admin Manual Admission: Admit/Enroll a student into a batch.
 * If new student: generates unique Grav ID (YYMMDD###) and sets password equal to Grav ID!
 */
export const adminAdmitStudent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'à¦…à¦¨à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤ à¦à¦•à§à¦¸à§‡à¦¸' });
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
      existingGravId,
      requestId,
    } = req.body;

    // Verify batch
    const batch = await Batch.findById(batchId).populate('courseId', 'title slug gradeLevel subject courseFee regularPrice discountPrice');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¿à¦¤ à¦¬à§à¦¯à¦¾à¦šà¦Ÿà¦¿ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤' });
    }

    let studentDoc: any = null;
    let isNewUserCreated = false;
    let generatedgravId = '';
    let defaultPassword = '';

    // If an existing student was selected
    if (existingGravId && existingGravId.trim() !== '') {
      studentDoc = await User.findOne({ gravId: existingGravId.trim(), role: ROLES.STUDENT });
      if (!studentDoc) {
        return res.status(404).json({
          success: false,
          message: 'বিদ্যমান শিক্ষার্থী পাওয়া যায়নি। অনুগ্রহ করে সঠিক Grav ID যাচাই করুন।',
        });
      }
      generatedgravId = studentDoc.gravId;
    } else {
      // New student admission flow
      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'নতুন শিক্ষার্থী নিবন্ধনের জন্য একটি সক্রিয় ও সঠিক ইমেইল এড্রেস আবশ্যক (লগইন তথ্য ও ওয়েলকাম বার্তা পাঠানো হবে)।',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Check if student with email already exists
      const existingEmailUser = await User.findOne({ email: normalizedEmail });
      if (existingEmailUser) {
        if (existingEmailUser.role !== ROLES.STUDENT) {
          return res.status(409).json({ success: false, message: 'এই ইমেইলটি অন্য একটি role-এর account-এ ব্যবহৃত। নতুন শিক্ষার্থীর জন্য আলাদা email দিন।' });
        }
        studentDoc = existingEmailUser;
        generatedgravId = existingEmailUser.gravId;
      } else {
        // Also check phone if provided
        if (phone && phone.trim() !== '') {
          const existingPhoneUser = await User.findOne({ phone: phone.trim() });
          if (existingPhoneUser) {
            if (existingPhoneUser.role !== ROLES.STUDENT) {
              return res.status(409).json({ success: false, message: 'এই phone number অন্য একটি role-এর account-এ ব্যবহৃত।' });
            }
            studentDoc = existingPhoneUser;
            generatedgravId = existingPhoneUser.gravId;
          }
        }

        if (!studentDoc) {
          // Check disposable email
          if (isDisposableEmail(normalizedEmail)) {
            return res.status(400).json({
              success: false,
              message: 'অনুগ্রহ করে একটি স্থায়ী ও ভ্যালিড ব্যক্তিগত ইমেইল ব্যবহার করুন (টেম্পোরারি ইমেইল অনুমোদিত নয়)।',
            });
          }

          // Check DNS MX records
          const hasMx = await hasValidMxRecords(normalizedEmail);
          if (!hasMx) {
            return res.status(400).json({
              success: false,
              message: 'ইমেইল ডোমেইনটি সক্রিয় বা সঠিক নয়। অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন।',
            });
          }

          generatedgravId = await generateUniquegravId();
          defaultPassword = generatedgravId;

          const passwordHash = await bcrypt.hash(defaultPassword, 10);
          studentDoc = await User.create({
            gravId: generatedgravId,
            name: name.trim(),
            email: normalizedEmail,
            phone: phone && phone.trim() !== '' ? phone.trim() : undefined,
            passwordHash,
            role: ROLES.STUDENT,
            status: 'pending_verification',
            emailVerified: false,
            studentDetails: {
              schoolOrCollege: schoolOrCollege || '',
              gradeLevel: gradeLevel || (batch.courseId as any)?.gradeLevel || '',
              guardianName: guardianName || '',
              guardianPhone: guardianPhone || '',
            },
          });
          isNewUserCreated = true;

          const { rawToken, verificationUrl } = await createEmailVerification({ accountId: studentDoc._id });
          const emailSent = await sendWelcomeRegistrationEmail({
            to: normalizedEmail,
            name: name.trim(),
            gravId: generatedgravId,
            role: 'student',
            password: defaultPassword,
            batchName: batch.name,
            verificationUrl,
          });
          if (!emailSent) {
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            await Promise.all([
              User.deleteOne({ _id: studentDoc._id }),
              EmailVerificationToken.deleteOne({ tokenHash }),
            ]);
            return res.status(400).json({
              success: false,
              message: 'শিক্ষার্থীর ইমেইলে verification link ও credential পাঠানো যায়নি। ইমেইলটি যাচাই করে আবার চেষ্টা করুন।',
            });
          }
        }
      }
    }

    if (!studentDoc) {
      return res.status(400).json({
        success: false,
        message: 'শিক্ষার্থীর তথ্য তৈরি বা সনাক্ত করা সম্ভব হয়নি। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।',
      });
    }

    const courseEnrollment = await findActiveEnrollmentInAnotherBatchOfCourse(
      studentDoc.gravId,
      (batch.courseId as any)._id || batch.courseId,
      batch._id
    );
    if (courseEnrollment) {
      return res.status(409).json({
        success: false,
        message: alreadyEnrolledInCourseMessage((courseEnrollment.batchId as any)?.name),
        enrollment: courseEnrollment,
      });
    }

    // Admin admission may be recorded while email verification is pending.
    // Login and authenticated routes still block this student until verification.

    const existingEnrollment = await Enrollment.findOne({
      gravId: studentDoc.gravId,
      batchId: batch._id,
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'enrolled' || existingEnrollment.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: `শিক্ষার্থী ${studentDoc.name} (Grav ID: ${studentDoc.gravId}) ইতিমধ্যে এই batch-এ enrolled আছেন।`,
          student: {
            _id: studentDoc._id,
            name: studentDoc.name,
            gravId: studentDoc.gravId,
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
          gravId: studentDoc.gravId,
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
          .populate('batchId', 'name courseId')
          .populate('courseId', 'title')
          .populate('collectedBy', 'name gravId role');
      } catch (payErr) {
        console.error('Failed to create Payment record on reactivation:', payErr);
      }

      return res.status(200).json({
        success: true,
        message: 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦° à¦­à¦°à§à¦¤à¦¿ à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦ªà§à¦¨à¦°à¦¾à§Ÿ à¦¸à¦•à§à¦°à¦¿à§Ÿ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!',
        isNewUserCreated,
        student: {
          _id: studentDoc._id,
          name: studentDoc.name,
          gravId: studentDoc.gravId,
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
      gravId: studentDoc.gravId,
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
        gravId: studentDoc.gravId,
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
        .populate('batchId', 'name fee courseId')
        .populate('courseId', 'title')
        .populate('collectedBy', 'name gravId role');
    } catch (payErr) {
      console.error('Failed to create initial Payment record:', payErr);
    }

    return res.status(201).json({
      success: true,
      message: 'à¦…à¦­à¦¿à¦¨à¦¨à§à¦¦à¦¨! à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦•à§‡ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¬à§à¦¯à¦¾à¦šà§‡ à¦­à¦°à§à¦¤à¦¿ à¦•à¦°à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡à¥¤',
      isNewUserCreated,
      student: {
        _id: studentDoc._id,
        name: studentDoc.name,
        gravId: studentDoc.gravId,
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
      message: error?.message || 'à¦­à¦°à§à¦¤à¦¿ à¦ªà§à¦°à¦•à§à¦°à¦¿à§Ÿà¦¾ à¦¸à¦®à§à¦ªà¦¨à§à¦¨ à¦•à¦°à¦¾ à¦¸à¦®à§à¦­à¦¬ à¦¹à§Ÿà¦¨à¦¿à¥¤',
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

    // If search keyword provided, first resolve matching public Grav IDs.
    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      const matchingStudents = await User.find({
        $or: [{ name: regex }, { gravId: regex }, { phone: regex }, { email: regex }],
      }).select('gravId');
      const gravIds = matchingStudents.map((s) => s.gravId);
      filter.gravId = { $in: gravIds };
    }

    const total = await Enrollment.countDocuments(filter);

    const enrollments = await Enrollment.find(filter)
      .populate('batchId', 'name fee capacity status')
      .populate('courseId', 'title slug gradeLevel subject')
      .populate('enrolledBy', 'name gravId role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const enrollmentGravIds = enrollments.map((enrollment) => enrollment.gravId).filter(Boolean);
    const students = await User.find({ gravId: { $in: enrollmentGravIds }, role: ROLES.STUDENT })
      .select('name gravId email phone avatarUrl studentDetails')
      .lean();
    const studentMap = new Map(students.map((student) => [student.gravId, student]));
    const enrichedEnrollments = enrollments.map((enrollment) => ({
      ...enrollment,
      student: studentMap.get(enrollment.gravId) || null,
    }));

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: enrichedEnrollments,
    });
  } catch (error: any) {
    console.error('getAdminEnrollments error:', error);
    return res.status(500).json({
      success: false,
      message: 'à¦­à¦°à§à¦¤à¦¿ à¦¤à¦¾à¦²à¦¿à¦•à¦¾ à¦²à§‹à¦¡ à¦•à¦°à¦¾ à¦¸à¦®à§à¦­à¦¬ à¦¹à§Ÿà¦¨à¦¿à¥¤',
    });
  }
};

/**
 * Admin action to remove/cancel student enrollment from a batch/course.
 * Supports either enrollmentId (in params) OR { batchId, gravId } in body/query.
 * Rule 1: "à¦†à¦®à¦¿ à¦¯à¦¦à¦¿ à¦•à§à¦²à¦¾à¦¸ à¦°à§à¦® à¦¥à§‡à¦•à§‡ à¦°à¦¿à¦®à§à¦­ à¦•à¦°à§‡ à¦¦à§‡à¦‡ à¦“à¦° à¦“à¦‡ à¦¬à§à¦¯à¦¾à¦šà§‡à¦° à¦¯à§‡à¦‡ à¦Ÿà§à¦°à¦¾à¦¨à¦œà§‡à¦•à¦¶à¦¨à¦—à§à¦²à§‹ à¦•à¦°à¦›à¦¿à¦² à¦Ÿà¦¾à¦•à¦¾ à¦ªà¦¯à¦¼à¦¸à¦¾ à¦°à¦¿à¦²à§‡à¦Ÿà§‡à¦¡ à¦¸à§‡à¦—à§à¦²à§‹ à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦¹à¦¯à¦¼à§‡ à¦¯à¦¾à¦¬à§‡ à¦à¦¬à¦‚ à¦«à¦¾à¦‡à¦¨à§à¦¯à¦¾à¦¨à§à¦¸à¦“ à¦¨à¦¤à§à¦¨ à¦•à¦°à§‡ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦¹à¦¬à§‡"
 */
export const removeStudentFromBatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'à¦…à¦¨à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤ à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸' });
    }

    const { enrollmentId } = req.params;
    const { batchId, gravId, reason } = req.body || {};

    let enrollment = null;

    if (enrollmentId && mongoose.Types.ObjectId.isValid(enrollmentId)) {
      enrollment = await Enrollment.findById(enrollmentId);
    } else if (batchId && gravId) {
      enrollment = await Enrollment.findOne({
        batchId,
        gravId,
        status: { $in: ['enrolled', 'completed', 'pending'] },
      });
    }

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'à¦•à§‹à¦¨à§‹ à¦¸à¦•à§à¦°à¦¿à§Ÿ à¦à¦¨à¦°à§‹à¦²à¦®à§‡à¦¨à§à¦Ÿ à¦¬à¦¾ à¦­à¦°à§à¦¤à¦¿ à¦°à§‡à¦•à¦°à§à¦¡ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤',
      });
    }

    const prevStatus = enrollment.status;
    const targetgravId = enrollment.gravId;
    const targetBatchId = enrollment.batchId;

    // 1. Delete all transactions/payments associated with this student and batch
    const deletePaymentResult = await Payment.deleteMany({
      gravId: targetgravId,
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
      message: 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦•à§‡ à¦¬à§à¦¯à¦¾à¦š à¦¥à§‡à¦•à§‡ à¦°à¦¿à¦®à§à¦­ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡ à¦à¦¬à¦‚ à¦¸à¦‚à¦¶à§à¦²à¦¿à¦·à§à¦Ÿ à¦Ÿà§à¦°à¦¾à¦¨à¦œà§à¦¯à¦¾à¦•à¦¶à¦¨à¦—à§à¦²à§‹ à¦®à§à¦›à§‡ à¦«à¦¾à¦‡à¦¨à§à¦¯à¦¾à¦¨à§à¦¸ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤',
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
      message: 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦•à§‡ à¦°à¦¿à¦®à§à¦­ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤',
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
      return res.status(401).json({ success: false, message: 'à¦…à¦¨à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤ à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸' });
    }

    const { enrollmentId, gravId, currentBatchId, targetBatchId, targetCourseId, reason } = req.body || {};

    let enrollment = null;
    if (enrollmentId && mongoose.Types.ObjectId.isValid(enrollmentId)) {
      enrollment = await Enrollment.findById(enrollmentId);
    } else if (gravId && currentBatchId) {
      enrollment = await Enrollment.findOne({
        gravId,
        batchId: currentBatchId,
        status: { $in: ['enrolled', 'completed', 'pending'] },
      });
    }

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦° à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨ à¦•à§‹à¦¨à§‹ à¦¸à¦•à§à¦°à¦¿à§Ÿ à¦­à¦°à§à¦¤à¦¿ à¦°à§‡à¦•à¦°à§à¦¡ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤',
      });
    }

    if (!targetBatchId) {
      return res.status(400).json({
        success: false,
        message: 'à¦¶à¦¿à¦«à¦Ÿ à¦•à¦°à¦¾à¦° à¦œà¦¨à§à¦¯ à¦¨à¦¤à§à¦¨ à¦¬à§à¦¯à¦¾à¦š à¦¨à¦¿à¦°à§à¦§à¦¾à¦°à¦£ à¦•à¦°à¦¾ à¦†à¦¬à¦¶à§à¦¯à¦•à¥¤',
      });
    }

    const targetBatch = await Batch.findById(targetBatchId).populate('courseId');
    if (!targetBatch) {
      return res.status(404).json({
        success: false,
        message: 'à¦‰à¦¦à§à¦¦à¦¿à¦·à§à¦Ÿ à¦¨à¦¤à§à¦¨ à¦¬à§à¦¯à¦¾à¦š à¦–à§à¦à¦œà§‡ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤',
      });
    }

    const targetCourse = (targetBatch.courseId as any) || (await Course.findById(targetBatch.courseId));
    if (!targetCourse) {
      return res.status(404).json({
        success: false,
        message: 'à¦‰à¦¦à§à¦¦à¦¿à¦·à§à¦Ÿ à¦¬à§à¦¯à¦¾à¦šà§‡à¦° à¦•à§‹à¦°à§à¦¸ à¦¤à¦¥à§à¦¯ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤',
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
    const studentObjectId = enrollment.gravId;

    // Check if student is already enrolled in targetBatch
    if (oldBatchId.toString() === targetBatch._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦‡à¦¤à¦¿à¦®à¦§à§à¦¯à§‡à¦‡ à¦à¦‡ à¦¬à§à¦¯à¦¾à¦šà§‡ à¦­à¦°à§à¦¤à¦¿ à¦†à¦›à§‡à¥¤',
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
      { gravId: studentObjectId, batchId: oldBatchId },
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
      message: `à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦•à§‡ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ "${targetBatch.name}" (${targetCourse.title}) à¦¬à§à¦¯à¦¾à¦šà§‡ à¦¶à¦¿à¦«à¦Ÿ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦¨à¦¤à§à¦¨ à¦¬à§à¦¯à¦¾à¦š à¦«à¦¿: à§³${currentTargetCourseFee.toLocaleString('bn-BD')}`,
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
      message: 'à¦¬à§à¦¯à¦¾à¦š à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤',
    });
  }
};


