import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { Module, Section, Lesson } from '../models/ContentHierarchy';
import { FileAsset } from '../models/FileAsset';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';

export const createBatchSchema = z.object({
  name: z.string().min(2).max(120),
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Course ID'),
  status: z.enum(['draft', 'upcoming', 'active', 'completed', 'archived']).default('draft'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  enrollmentOpenDate: z.string().datetime().optional(),
  enrollmentCloseDate: z.string().datetime().optional(),
  capacity: z.number().min(0).optional(),
  scheduleText: z.string().optional(),
  // CRITICAL FEATURE: Copy content from an existing batch
  copyFromBatchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Source Batch ID').optional(),
});

/**
 * List batches for a course
 */
export const getBatches = async (req: Request, res: Response) => {
  try {
    const { courseId, status } = req.query;
    const filter: any = {};

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
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch batches' });
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
      startDate,
      endDate,
      enrollmentOpenDate,
      enrollmentCloseDate,
      capacity,
      scheduleText,
      copyFromBatchId,
    } = req.body;

    // 1. Create the new destination Batch record
    const newBatch = await Batch.create({
      name,
      courseId,
      status: status || 'draft',
      startDate,
      endDate,
      enrollmentOpenDate,
      enrollmentCloseDate,
      capacity,
      scheduleText,
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
