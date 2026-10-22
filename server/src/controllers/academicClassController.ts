import { Request, Response } from 'express';
import { z } from 'zod';
import { AcademicClass } from '../models/AcademicClass';
import { Course } from '../models/Course';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditLog } from '../models/AuditLog';

// Default initial academic classes with common subjects
export const DEFAULT_CLASSES = [
  { name: 'Class 6', order: 1, subjects: [] },
  { name: 'Class 7', order: 2, subjects: [] },
  { name: 'Class 8', order: 3, subjects: [] },
  { name: 'Class 9', order: 4, subjects: [] },
  { name: 'Class 10', order: 5, subjects: [] },
  { name: 'Class 11', order: 6, subjects: [] },
  { name: 'Class 12', order: 7, subjects: [] },
];

/**
 * Seed initial classes if database table is empty
 */
async function ensureDefaultClasses() {
  const count = await AcademicClass.countDocuments();
  if (count === 0) {
    await AcademicClass.insertMany(DEFAULT_CLASSES);
  }
}

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(80),
  order: z.number().optional().default(0),
  description: z.string().optional(),
  subjects: z.array(z.string().trim().min(1)).optional().default([]),
});

export const updateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(80).optional(),
  order: z.number().optional(),
  description: z.string().optional(),
  subjects: z.array(z.string().trim().min(1)).optional(),
});

/**
 * List all classes with their subjects
 */
export const getAcademicClasses = async (req: Request, res: Response) => {
  try {
    await ensureDefaultClasses();
    const classes = await AcademicClass.find().sort({ order: 1, name: 1 });
    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch academic classes' });
  }
};

/**
 * Create a new Academic Class
 */
export const createAcademicClass = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, order, description, subjects } = req.body;

    const trimmedName = name.trim();
    const existing = await AcademicClass.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `Class "${trimmedName}" already exists` });
    }

    const academicClass = await AcademicClass.create({
      name: trimmedName,
      order: order ?? 0,
      description: description || '',
      subjects: Array.isArray(subjects) && subjects.length > 0 ? subjects : ['General'],
    });

    await AuditLog.create({
      actorId: req.user?._id,
      actorEmail: req.user?.email,
      action: 'CLASS_CREATE',
      resourceType: 'AcademicClass',
      resourceId: academicClass._id.toString(),
      metadata: { name: academicClass.name, subjects: academicClass.subjects },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: `Class "${academicClass.name}" created successfully`,
      data: academicClass,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create academic class' });
  }
};

/**
 * Update an Academic Class.
 * If the class name changed, automatically cascades and updates all Courses referencing the old class name!
 */
export const updateAcademicClass = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, order, description, subjects } = req.body;

    const currentClass = await AcademicClass.findById(id);
    if (!currentClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const oldName = currentClass.name;
    const newName = name ? name.trim() : oldName;

    // Check duplicate name
    if (newName !== oldName) {
      const duplicate = await AcademicClass.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${newName}$`, 'i') },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Class name "${newName}" already in use` });
      }
    }

    currentClass.name = newName;
    if (order !== undefined) currentClass.order = order;
    if (description !== undefined) currentClass.description = description;
    if (Array.isArray(subjects)) currentClass.subjects = subjects;

    await currentClass.save();

    // Cascade update to all Courses that were tagged with oldName
    if (newName !== oldName) {
      const updateResult = await Course.updateMany(
        { gradeLevel: oldName },
        { $set: { gradeLevel: newName } }
      );

      await AuditLog.create({
        actorId: req.user?._id,
        actorEmail: req.user?.email,
        action: 'CLASS_RENAME_CASCADE',
        resourceType: 'Course',
        metadata: { oldName, newName, modifiedCoursesCount: updateResult.modifiedCount },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    return res.status(200).json({
      success: true,
      message: `Class "${newName}" updated successfully across the platform`,
      data: currentClass,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update academic class' });
  }
};

/**
 * Delete an Academic Class.
 * Safe retention: Does NOT delete courses or batches.
 * Instead, updates orphaned courses' gradeLevel to 'Unknown' so they remain accessible and re-assignable.
 */
export const deleteAcademicClass = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const academicClass = await AcademicClass.findById(id);
    if (!academicClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const className = academicClass.name;
    await AcademicClass.findByIdAndDelete(id);

    // Retain courses safely: re-tag them as 'Unknown'
    const courseUpdateResult = await Course.updateMany(
      { gradeLevel: className },
      { $set: { gradeLevel: 'Unknown' } }
    );

    await AuditLog.create({
      actorId: req.user?._id,
      actorEmail: req.user?.email,
      action: 'CLASS_DELETE_SAFE',
      resourceType: 'AcademicClass',
      resourceId: id,
      metadata: {
        deletedClassName: className,
        reassignedCoursesToUnknownCount: courseUpdateResult.modifiedCount,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: `Class "${className}" deleted. ${courseUpdateResult.modifiedCount} courses have been preserved and marked as 'Unknown' for reassignment.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete academic class' });
  }
};
