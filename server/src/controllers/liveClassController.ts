import { Request, Response } from 'express';
import { z } from 'zod';
import { LiveClass } from '../models/LiveClass';
import { Enrollment } from '../models/Enrollment';
import { AuthenticatedRequest } from '../middleware/auth';
import { ROLES } from '../types/roles';

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

    // Helper to generate a random 3-4-3 Google Meet room code (e.g. meet.google.com/abc-defg-hij)
    const generateMeetUrl = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const randSeg = (len: number) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `https://meet.google.com/${randSeg(3)}-${randSeg(4)}-${randSeg(3)}`;
    };

    let meetingUrl = data.meetingUrl?.trim();
    if (!meetingUrl && data.provider === 'google_meet') {
      meetingUrl = generateMeetUrl();
    }

    const liveClass = await LiveClass.create({
      ...data,
      meetingUrl,
      teacherId,
    });

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
    const studentId = req.user?._id;

    // Get batches student is enrolled in
    const enrollments = await Enrollment.find({ studentId, status: 'enrolled' }).select('batchId');
    const batchIds = enrollments.map((e) => e.batchId);

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
    const liveClass = await LiveClass.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
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
    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete live class' });
  }
};

