import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { Module, Section, Lesson } from '../models/ContentHierarchy';
import { FileAsset } from '../models/FileAsset';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';

import { Enrollment } from '../models/Enrollment';

export const scheduleSlotSchema = z.object({
  day: z.enum(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
  startTime: z.string().min(1),
  endTime: z.string().optional(),
  topic: z.string().optional(),
});

export const createBatchSchema = z.object({
  name: z.string().min(2).max(120),
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Course ID'),
  status: z.enum(['draft', 'upcoming', 'active', 'completed', 'archived']).default('draft'),
  fee: z.number().min(0).optional().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  enrollmentOpenDate: z.string().datetime().optional(),
  enrollmentCloseDate: z.string().datetime().optional(),
  capacity: z.number().min(0).optional(),
  scheduleText: z.string().optional(),
  meetingUrl: z.string().optional(),
  weeklySchedule: z.array(scheduleSlotSchema).optional(),
  // CRITICAL FEATURE: Copy content from an existing batch
  copyFromBatchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Source Batch ID').optional(),
});

/**
 * List batches for a course
 */
export const getBatches = async (req: Request, res: Response) => {
  try {
    const { courseId, status, teacherId } = req.query;
    const filter: any = {};

    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId as string)) {
      const teacherObjId = new mongoose.Types.ObjectId(teacherId as string);
      // Find all courses where this teacher is an assigned instructor
      const teacherCourses = await Course.find({ instructors: teacherObjId }).select('_id');
      const teacherCourseIds = teacherCourses.map((c) => c._id);

      filter.$or = [
        { assignedTeachers: teacherObjId },
        { courseId: { $in: teacherCourseIds } },
      ];
    }

    if (courseId) {
      if (mongoose.Types.ObjectId.isValid(courseId as string)) {
        filter.courseId = courseId;
      } else {
        // Find course by slug first
        const foundCourse = await Course.findOne({ slug: courseId });
        if (foundCourse) {
          filter.courseId = foundCourse._id;
        } else {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
      }
    }
    if (status) filter.status = status;

    const batches = await Batch.find(filter)
      .populate('courseId', 'title slug gradeLevel subject')
      .populate('assignedTeachers', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Attach enrolledStudentCount to each batch
    const batchIds = batches.map((b) => b._id);
    const countAgg = await Enrollment.aggregate([
      {
        $match: {
          batchId: { $in: batchIds },
          status: { $in: ['enrolled', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$batchId',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map<string, number>();
    countAgg.forEach((item) => {
      countMap.set(item._id.toString(), item.count);
    });

    const enrichedBatches = batches.map((b) => ({
      ...b,
      enrolledStudentCount: countMap.get(b._id.toString()) || 0,
    }));

    return res.status(200).json({ success: true, count: enrichedBatches.length, data: enrichedBatches });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch batches' });
  }
};

/**
 * Get Single Batch Details
 */
export const getBatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findById(id)
      .populate('courseId', 'title slug gradeLevel subject')
      .populate('assignedTeachers', 'name email');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    return res.status(200).json({ success: true, data: batch });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch batch details' });
  }
};

/**
 * Get Batch Details along with full Content Hierarchy
 */
export const getBatchHierarchy = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId).populate('courseId', 'title slug gradeLevel subject');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Fetch all Modules, Sections, and Lessons for this batch, sorted by order
    const modules = await Module.find({ batchId }).sort({ order: 1 }).lean();
    const sections = await Section.find({ batchId }).sort({ order: 1 }).lean();
    const lessons = await Lesson.find({ batchId })
      .populate('resources.fileAssetId', 'originalName mimeType sizeBytes googleDriveFileId')
      .sort({ order: 1 })
      .lean();

    // Assemble nested structure
    const structuredModules = modules.map((mod) => {
      const modSections = sections.filter((s) => s.moduleId.toString() === mod._id.toString());
      const modLessonsDirect = lessons.filter(
        (l) => l.moduleId.toString() === mod._id.toString() && !l.sectionId
      );

      const assembledSections = modSections.map((sec) => ({
        ...sec,
        lessons: lessons.filter((l) => l.sectionId?.toString() === sec._id.toString()),
      }));

      return {
        ...mod,
        directLessons: modLessonsDirect,
        sections: assembledSections,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        batch,
        modules: structuredModules,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch batch hierarchy' });
  }
};

/**
 * CRITICAL FEATURE: Create Batch with Optional Independent Content Hierarchy Duplication
 */
export const createBatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      courseId,
      status,
      fee,
      startDate,
      endDate,
      enrollmentOpenDate,
      enrollmentCloseDate,
      capacity,
      scheduleText,
      meetingUrl,
      weeklySchedule,
      copyFromBatchId,
    } = req.body;

    // Helper to generate a random 3-4-3 Google Meet room code (e.g. meet.google.com/abc-defg-hij)
    const generateMeetUrl = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const randSeg = (len: number) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `https://meet.google.com/${randSeg(3)}-${randSeg(4)}-${randSeg(3)}`;
    };

    const finalMeetingUrl = meetingUrl && meetingUrl.trim().length > 0 ? meetingUrl.trim() : generateMeetUrl();

    // 1. Create the new destination Batch record
    const newBatch = await Batch.create({
      name,
      courseId,
      status: status || 'draft',
      fee: fee !== undefined ? Number(fee) : 0,
      startDate,
      endDate,
      enrollmentOpenDate,
      enrollmentCloseDate,
      capacity,
      scheduleText,
      meetingUrl: finalMeetingUrl,
      weeklySchedule: Array.isArray(weeklySchedule) ? weeklySchedule : [],
      sourceBatchId: copyFromBatchId ? new mongoose.Types.ObjectId(copyFromBatchId) : undefined,
    });

    // 2. If copyFromBatchId is provided, perform deep independent duplication
    if (copyFromBatchId) {
      const sourceBatch = await Batch.findById(copyFromBatchId);
      if (!sourceBatch) {
        return res.status(404).json({ success: false, message: 'Source batch not found for copying' });
      }

      // Fetch all content of source batch in order
      const sourceModules = await Module.find({ batchId: copyFromBatchId }).sort({ order: 1 });
      const sourceSections = await Section.find({ batchId: copyFromBatchId }).sort({ order: 1 });
      const sourceLessons = await Lesson.find({ batchId: copyFromBatchId }).sort({ order: 1 });

      // ID mapping from Source ID -> Destination ID to maintain parent-child links
      const moduleMap = new Map<string, mongoose.Types.ObjectId>();
      const sectionMap = new Map<string, mongoose.Types.ObjectId>();

      // A. Clone Modules
      for (const srcMod of sourceModules) {
        const clonedMod = await Module.create({
          batchId: newBatch._id,
          title: srcMod.title,
          order: srcMod.order,
          isPublished: srcMod.isPublished,
        });
        moduleMap.set(srcMod._id.toString(), clonedMod._id as mongoose.Types.ObjectId);
      }

      // B. Clone Sections
      for (const srcSec of sourceSections) {
        const destModId = moduleMap.get(srcSec.moduleId.toString());
        if (!destModId) continue;

        const clonedSec = await Section.create({
          batchId: newBatch._id,
          moduleId: destModId,
          title: srcSec.title,
          order: srcSec.order,
        });
        sectionMap.set(srcSec._id.toString(), clonedSec._id as mongoose.Types.ObjectId);
      }

      // C. Clone Lessons & Resource References
      for (const srcLesson of sourceLessons) {
        const destModId = moduleMap.get(srcLesson.moduleId.toString());
        if (!destModId) continue;

        const destSecId = srcLesson.sectionId
          ? sectionMap.get(srcLesson.sectionId.toString())
          : undefined;

        // Duplicate lesson with isolated record
        // Reuse immutable FileAsset references and increment reference count
        const clonedResources = [];
        for (const resItem of srcLesson.resources) {
          if (resItem.fileAssetId) {
            await FileAsset.findByIdAndUpdate(resItem.fileAssetId, {
              $inc: { referenceCount: 1 },
            });
          }
          clonedResources.push({
            title: resItem.title,
            type: resItem.type,
            fileAssetId: resItem.fileAssetId,
            externalUrl: resItem.externalUrl,
          });
        }

        await Lesson.create({
          batchId: newBatch._id,
          moduleId: destModId,
          sectionId: destSecId,
          title: srcLesson.title,
          order: srcLesson.order,
          description: srcLesson.description,
          youtubeVideoId: srcLesson.youtubeVideoId,
          videoDurationSeconds: srcLesson.videoDurationSeconds,
          resources: clonedResources,
          isPublished: srcLesson.isPublished,
        });
      }

      // Audit Log for Duplication
      await AuditLog.create({
        actorId: req.user?._id,
        actorEmail: req.user?.email,
        action: 'BATCH_DUPLICATE',
        resourceType: 'Batch',
        resourceId: newBatch._id.toString(),
        metadata: {
          sourceBatchId: copyFromBatchId,
          sourceBatchName: sourceBatch.name,
          newBatchName: newBatch.name,
          modulesCopied: sourceModules.length,
          lessonsCopied: sourceLessons.length,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    return res.status(201).json({
      success: true,
      message: copyFromBatchId
        ? 'Batch created with cloned content hierarchy successfully'
        : 'Empty batch created successfully',
      data: newBatch,
    });
  } catch (error: any) {
    console.error('Batch creation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create batch' });
  }
};

/**
 * Update Batch (Name, Schedule, Fee, Capacity, Status, CourseId)
 */
export const updateBatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, courseId, status, fee, scheduleText, weeklySchedule, capacity } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    if (name !== undefined) batch.name = name;
    if (courseId !== undefined) batch.courseId = courseId;
    if (status !== undefined) batch.status = status;
    if (fee !== undefined) batch.fee = Number(fee);
    if (scheduleText !== undefined) batch.scheduleText = scheduleText;
    if (req.body.meetingUrl !== undefined) batch.meetingUrl = req.body.meetingUrl;
    if (weeklySchedule !== undefined && Array.isArray(weeklySchedule)) {
      batch.weeklySchedule = weeklySchedule;
    }
    if (capacity !== undefined) batch.capacity = Number(capacity);

    await batch.save();

    return res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: batch,
    });
  } catch (error: any) {
    console.error('Batch update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update batch' });
  }
};

/**
 * Delete Batch
 */
export const deleteBatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    await Batch.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error: any) {
    console.error('Batch delete error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete batch' });
  }
};

/**
 * Get Comprehensive Schedule Overview (organized by Day of Week & Today's classes)
 * Usable by Admin, Teachers, and Students
 */
export const getScheduleOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { day, batchId, status } = req.query;

    const filter: any = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['active', 'upcoming'] };
    }
    if (batchId && mongoose.Types.ObjectId.isValid(batchId as string)) {
      filter._id = batchId;
    }

    // Role-based personalization:
    // 1. Admin/Superadmin: sees all batches
    // 2. Student: sees only batches they are actively enrolled in
    // 3. Teacher: sees only batches they are assigned to (or if no batches specifically assigned, all active batches)
    const currentUser = req.user;
    if (currentUser) {
      if (currentUser.role === 'student') {
        const studentEnrollments = await Enrollment.find({
          studentId: currentUser._id,
          status: { $in: ['enrolled', 'completed'] },
        }).select('batchId');

        const enrolledBatchIds = studentEnrollments.map((e) => e.batchId);
        filter._id = { $in: enrolledBatchIds };
      } else if (currentUser.role === 'teacher') {
        // Find batches where this teacher is assigned directly or via course instructors
        const teacherCourses = await Course.find({ instructors: currentUser._id }).select('_id');
        const teacherCourseIds = teacherCourses.map((c) => c._id);

        const teacherAssignedBatches = await Batch.find({
          $or: [
            { assignedTeachers: currentUser._id },
            { courseId: { $in: teacherCourseIds } },
          ],
          status: { $in: ['active', 'upcoming'] },
        }).select('_id');

        if (teacherAssignedBatches.length > 0) {
          filter._id = { $in: teacherAssignedBatches.map((b) => b._id) };
        } else {
          // If teacher is not assigned to any specific batch or course yet, return nothing for this teacher
          filter._id = { $in: [] };
        }
      }
    }

    const batches = await Batch.find(filter)
      .populate('courseId', 'title slug gradeLevel subject')
      .populate('assignedTeachers', 'name email');

    // Day mapping in order
    const daysOrder = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    // Day names in English & Bengali
    const dayLabels: Record<string, { en: string; bn: string }> = {
      saturday: { en: 'Saturday', bn: 'শনিবার' },
      sunday: { en: 'Sunday', bn: 'রবিবার' },
      monday: { en: 'Monday', bn: 'সোমবার' },
      tuesday: { en: 'Tuesday', bn: 'মঙ্গলবার' },
      wednesday: { en: 'Wednesday', bn: 'বুধবার' },
      thursday: { en: 'Thursday', bn: 'বৃহস্পতিবার' },
      friday: { en: 'Friday', bn: 'শুক্রবার' },
    };

    // Aggregate into daily schedule buckets
    const scheduleByDay: Record<string, any[]> = {
      saturday: [],
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    };

    batches.forEach((b) => {
      if (Array.isArray(b.weeklySchedule) && b.weeklySchedule.length > 0) {
        b.weeklySchedule.forEach((slot) => {
          const d = slot.day.toLowerCase();
          if (scheduleByDay[d]) {
            scheduleByDay[d].push({
              batchId: b._id,
              batchName: b.name,
              status: b.status,
              course: b.courseId,
              assignedTeachers: b.assignedTeachers,
              day: slot.day,
              startTime: slot.startTime,
              endTime: slot.endTime || '',
              topic: slot.topic || '',
              meetingUrl: b.meetingUrl || '',
            });
          }
        });
      }
    });

    // Sort each day's slots by startTime
    Object.keys(scheduleByDay).forEach((d) => {
      scheduleByDay[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Detect Today's day
    const jsDayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = jsDayMap[new Date().getDay()];

    const todayClasses = scheduleByDay[todayName] || [];

    if (day && typeof day === 'string' && scheduleByDay[day.toLowerCase()]) {
      return res.status(200).json({
        success: true,
        selectedDay: day.toLowerCase(),
        classes: scheduleByDay[day.toLowerCase()],
      });
    }

    return res.status(200).json({
      success: true,
      today: {
        day: todayName,
        label: dayLabels[todayName],
        classesCount: todayClasses.length,
        classes: todayClasses,
      },
      scheduleByDay,
      dayLabels,
      daysOrder,
    });
  } catch (error: any) {
    console.error('Schedule overview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch schedule overview' });
  }
};
