import { Request, Response } from 'express';
import { z } from 'zod';
import { LiveClass } from '../models/LiveClass';
import { Enrollment } from '../models/Enrollment';
import { AuthenticatedRequest } from '../middleware/auth';
import { ROLES } from '../types/roles';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { hasActiveStudentBatchAccess } from '../services/batchAccessService';
import { classroomLink, dispatchNotification, formatDate, notifyBatchStudents } from '../services/classroomNotificationService';

/** Issue no token here: this proves that the signed-in person may join a batch room. */
export const authorizeClassroomLiveJoin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.body as { batchId?: string };
    const user = req.user;
    if (!user || !batchId || !/^[0-9a-fA-F]{24}$/.test(batchId)) {
      return res.status(400).json({ success: false, message: 'Invalid classroom request.' });
    }

    if (user.role === ROLES.ADMIN || user.role === ROLES.SUPERADMIN) {
      return res.json({ success: true, data: { name: user.name } });
    }

    const batch = await Batch.findById(batchId).select('assignedTeachers courseId endDate').lean();
    if (!batch) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    let allowed = false;
    if (user.role === ROLES.TEACHER) {
      if (batch.assignedTeachers?.length) {
        allowed = batch.assignedTeachers.some((teacherId) => teacherId.toString() === user._id.toString());
      } else {
        const course = await Course.findById(batch.courseId).select('instructors').lean();
        allowed = (course?.instructors || []).some((teacherId) => teacherId.toString() === user._id.toString());
      }
    } else if (user.role === ROLES.STUDENT) {
      const enrollment = await Enrollment.findOne({ batchId, gravId: user.gravId, status: { $in: ['enrolled', 'completed'] } }).lean();
      const course = await Course.findById(batch.courseId).select('studentAccessMode studentAccessMonths').lean();
      allowed = !!enrollment && !!course && hasActiveStudentBatchAccess(batch as any, enrollment as any, course as any);
    }

    if (!allowed) return res.status(403).json({ success: false, message: 'You do not have access to this live classroom.' });
    return res.json({ success: true, data: { name: user.name } });
  } catch {
    return res.status(500).json({ success: false, message: 'Could not authorize live classroom access.' });
  }
};

export const createLiveClassSchema = z.object({
  title: z.string().min(3),
  thumbnailUrl: z.string().optional(),
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Batch ID').optional(),
  isFreePublic: z.boolean().default(false),
  provider: z.enum(['google_meet', 'zoom']).default('google_meet'),
  meetingUrl: z.string().url('Invalid meeting URL').optional().or(z.literal('')),
  meetingPassword: z.string().optional(),
  startTime: z.string().datetime(),
  durationMinutes: z.number().min(15).default(60),
  instructions: z.string().optional(),
});

/**
 * Public endpoint to list all upcoming Free Public Masterclasses / Webinars
 */
export const getFreePublicClasses = async (req: Request, res: Response) => {
  try {
    const freeClasses = await LiveClass.find({
      isFreePublic: true,
      isPublished: true,
    })
      .populate('teacherId', 'name email avatarUrl')
      .sort({ startTime: 1 });

    return res.status(200).json({ success: true, count: freeClasses.length, data: freeClasses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch free classes' });
  }
};

/**
 * List live classes (Teachers/Admins or filtered by batch)
 */
export const getLiveClasses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId, isFreePublic } = req.query;
    const filter: any = {};

    if (batchId) filter.batchId = batchId;
    if (isFreePublic !== undefined) filter.isFreePublic = isFreePublic === 'true';

    const liveClasses = await LiveClass.find(filter)
      .populate('batchId', 'name courseId')
      .populate('teacherId', 'name email')
      .sort({ startTime: 1 });

    return res.status(200).json({ success: true, count: liveClasses.length, data: liveClasses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch live classes' });
  }
};

/**
 * Schedule a new Class or Free Public Class (Teacher, Admin, Superadmin)
 */
export const createLiveClass = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const teacherId = req.user?._id;

    const meetingUrl = data.meetingUrl?.trim() || '';

    const liveClass = await LiveClass.create({
      ...data,
      meetingUrl,
      teacherId,
    });

    if (!liveClass.isFreePublic && liveClass.isPublished && liveClass.batchId) {
      dispatchNotification(notifyBatchStudents(liveClass.batchId.toString(), `নতুন লাইভ ক্লাস: ${liveClass.title}`,
        `লাইভ ক্লাসের সময়: ${formatDate(liveClass.startTime)}\n${classroomLink(liveClass.batchId.toString())}`));
    }

    return res.status(201).json({
      success: true,
      message: data.isFreePublic ? 'Free Masterclass scheduled successfully' : 'Batch class scheduled successfully',
      data: liveClass,
    });
  } catch (error: any) {
    console.error('Create live class error:', error);
    return res.status(500).json({ success: false, message: 'Failed to schedule class' });
  }
};

/**
 * Get Student's Upcoming Live Classes (verifying active batch enrollments)
 */
export const getStudentLiveClasses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const gravId = req.user?.gravId;

    // Get batches student is enrolled in
    const enrollments = await Enrollment.find({ gravId, status: 'enrolled' }).select('batchId enrolledAt');
    const batches = await Batch.find({ _id: { $in: enrollments.map((e) => e.batchId) } }).select('_id endDate courseId').populate('courseId', 'studentAccessMode studentAccessMonths').lean();
    const batchById = new Map(batches.map((batch) => [batch._id.toString(), batch]));
    const batchIds = enrollments.filter((enrollment) => {
      const batch = batchById.get(enrollment.batchId.toString());
      return !!batch && !!batch.courseId && hasActiveStudentBatchAccess(batch as any, enrollment, batch.courseId as any);
    }).map((enrollment) => enrollment.batchId);

    const liveClasses = await LiveClass.find({
      batchId: { $in: batchIds },
      isPublished: true,
    })
      .populate('batchId', 'name')
      .populate('teacherId', 'name')
      .sort({ startTime: 1 });

    return res.status(200).json({ success: true, count: liveClasses.length, data: liveClasses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch student live classes' });
  }
};

/**
 * Update a Live Class / Free Webinar (Teacher, Admin, Superadmin)
 */
export const updateLiveClass = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const previous = await LiveClass.findById(id).lean();
    const liveClass = await LiveClass.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (previous && !liveClass.isFreePublic && liveClass.batchId && liveClass.isPublished &&
      (!previous.isPublished || previous.startTime.getTime() !== liveClass.startTime.getTime())) {
      dispatchNotification(notifyBatchStudents(liveClass.batchId.toString(), `লাইভ ক্লাসের সময় ${previous.isPublished ? 'পরিবর্তন' : 'প্রকাশ'}: ${liveClass.title}`,
        `নতুন সময়: ${formatDate(liveClass.startTime)}\n${classroomLink(liveClass.batchId.toString())}`));
    }
    if (previous?.isPublished && !liveClass.isPublished && !liveClass.isFreePublic && liveClass.batchId) {
      dispatchNotification(notifyBatchStudents(liveClass.batchId.toString(), `লাইভ ক্লাস বাতিল: ${liveClass.title}`,
        `${formatDate(previous.startTime)}-এর লাইভ ক্লাস বাতিল করা হয়েছে।\n${classroomLink(liveClass.batchId.toString())}`));
    }
    return res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: liveClass,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update live class' });
  }
};

/**
 * Delete a Live Class / Free Webinar (Teacher, Admin, Superadmin)
 */
export const deleteLiveClass = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.findByIdAndDelete(id);
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (!liveClass.isFreePublic && liveClass.isPublished && liveClass.batchId) {
      dispatchNotification(notifyBatchStudents(liveClass.batchId.toString(), `লাইভ ক্লাস বাতিল: ${liveClass.title}`,
        `${formatDate(liveClass.startTime)}-এর লাইভ ক্লাস বাতিল করা হয়েছে।\n${classroomLink(liveClass.batchId.toString())}`));
    }
    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete live class' });
  }
};

