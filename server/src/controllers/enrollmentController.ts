import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Enrollment } from '../models/Enrollment';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { AuthenticatedRequest } from '../middleware/auth';

export const enrollBatchSchema = z.object({
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Batch ID'),
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
