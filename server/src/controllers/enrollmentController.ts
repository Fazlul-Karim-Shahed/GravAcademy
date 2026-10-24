import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Enrollment } from '../models/Enrollment';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { AuthenticatedRequest } from '../middleware/auth';

import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateUniqueUserId } from './authController';
import { ROLES } from '../types/roles';

export const enrollBatchSchema = z.object({
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Batch ID'),
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
  notes: z.string().optional().or(z.literal('')),
  existingStudentId: z.string().optional().or(z.literal('')), // in case an existing student is selected
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

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'ব্যাচটি পাওয়া যায়নি' });
    }

    // Check if batch is archived or draft
    if (batch.status === 'archived') {
      return res.status(400).json({ success: false, message: 'এই ব্যাচে নতুন ভর্তি বন্ধ রয়েছে' });
    }

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

    // Create Enrollment
    const newEnrollment = await Enrollment.create({
      studentId,
      batchId,
      courseId: batch.courseId,
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
      notes = '',
      existingStudentId,
    } = req.body;

    // Verify batch
    const batch = await Batch.findById(batchId).populate('courseId', 'title slug gradeLevel subject');
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
      await existingEnrollment.save();

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
      });
    }

    // Create new Enrollment record
    const enrollment = await Enrollment.create({
      studentId: studentDoc._id,
      batchId: batch._id,
      courseId: batch.courseId._id || batch.courseId,
      status: 'enrolled',
      enrolledAt: new Date(),
      paymentFee: Number(paymentFee) || 0,
      paymentStatus: paymentStatus || 'paid',
      enrolledBy: adminUser._id,
      notes: notes || '',
    });

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

