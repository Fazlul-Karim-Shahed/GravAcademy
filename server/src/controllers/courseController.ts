import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { z } from 'zod';
import { Course } from '../models/Course';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditLog } from '../models/AuditLog';

export const createCourseSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().optional(),
  gradeLevel: z.string().min(1, 'Grade/Class level is required (e.g. Class 6, Class 10)'),
  subject: z.string().min(1, 'Subject is required (e.g. Bangla, Physics)'),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  courseFee: z.number().min(0).default(0),
  duration: z.string().optional(),
  isPublished: z.boolean().default(false),
});

/**
 * List Courses (with filters for grade, subject, status)
 */
export const getCourses = async (req: Request, res: Response) => {
  try {
    const { gradeLevel, subject, isPublished, search } = req.query;
    const filter: any = {};

    if (gradeLevel) filter.gradeLevel = gradeLevel;
    if (subject) filter.subject = subject;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    if (search) {
      filter.$text = { $search: search as string };
    }

    const courses = await Course.find(filter)
      .populate('instructors', 'name email avatarUrl phone role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

/**
 * Get Course By ID or Slug
 */
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if parameter is a valid 24-character hexadecimal ObjectId or human-readable slug
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };

    const course = await Course.findOne(query).populate('instructors', 'name email avatarUrl phone role');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.status(200).json({ success: true, data: course });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch course' });
  }
};

/**
 * Create Dynamic Course (Admin / Superadmin)
 */
export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;

    // Generate unique slug
    let baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (await Course.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const course = await Course.create({
      ...data,
      slug,
    });

    await AuditLog.create({
      actorId: req.user?._id,
      actorEmail: req.user?.email,
      action: 'COURSE_CREATE',
      resourceType: 'Course',
      resourceId: course._id.toString(),
      metadata: { title: course.title, gradeLevel: course.gradeLevel, subject: course.subject },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error: any) {
    console.error('Course creation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create course' });
  }
};

/**
 * Update Course
 */
export const updateCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update course' });
  }
};

/**
 * Delete Course
 */
export const deleteCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    await AuditLog.create({
      actorId: req.user?._id,
      actorEmail: req.user?.email,
      action: 'COURSE_DELETE',
      resourceType: 'Course',
      resourceId: id,
      metadata: { title: course.title },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
};
