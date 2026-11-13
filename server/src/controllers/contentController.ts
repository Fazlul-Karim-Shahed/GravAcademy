import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Module, Section, Lesson } from '../models/ContentHierarchy';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { AuthenticatedRequest } from '../middleware/auth';

const isAdminRole = (role?: string) => role === 'admin' || role === 'superadmin';

const teacherCanManageBatch = async (req: AuthenticatedRequest, batchId: string) => {
  const user = req.user;
  if (!user) return false;
  if (isAdminRole(user.role)) return true;
  if (user.role !== 'teacher' || !mongoose.Types.ObjectId.isValid(batchId)) return false;

  const batch = await Batch.findById(batchId).select('assignedTeachers courseId').lean();
  if (!batch) return false;

  if (batch.assignedTeachers?.length) {
    return batch.assignedTeachers.some((teacherId) => teacherId.toString() === user._id.toString());
  }

  const course = await Course.findById(batch.courseId).select('instructors').lean();
  return (course?.instructors || []).some((teacherId) => teacherId.toString() === user._id.toString());
};

const denyContentAccess = (res: Response) =>
  res.status(403).json({ success: false, message: 'You can only manage content in your assigned batch.' });

// --- MODULE CRUD ---
export const createModule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId, title, order, isPublished } = req.body;
    if (!(await teacherCanManageBatch(req, batchId))) return denyContentAccess(res);
    const maxOrder = await Module.find({ batchId }).countDocuments();

    const module = await Module.create({
      batchId,
      title,
      order: order !== undefined ? order : maxOrder,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    return res.status(201).json({ success: true, data: module });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create module' });
  }
};

export const updateModule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingModule = await Module.findById(id);
    if (!existingModule) return res.status(404).json({ success: false, message: 'Module not found' });
    if (!(await teacherCanManageBatch(req, existingModule.batchId.toString()))) return denyContentAccess(res);
    const module = await Module.findByIdAndUpdate(id, req.body, { new: true });
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    return res.status(200).json({ success: true, data: module });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update module' });
  }
};

export const deleteModule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingModule = await Module.findById(id);
    if (!existingModule) return res.status(404).json({ success: false, message: 'Module not found' });
    if (!(await teacherCanManageBatch(req, existingModule.batchId.toString()))) return denyContentAccess(res);
    // Delete cascading sections and lessons in this module
    await Lesson.deleteMany({ moduleId: id });
    await Section.deleteMany({ moduleId: id });
    await Module.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'Module and nested lessons deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete module' });
  }
};

// --- SECTION CRUD ---
export const createSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId, moduleId, title, order } = req.body;
    if (!(await teacherCanManageBatch(req, batchId))) return denyContentAccess(res);
    const parentModule = await Module.findOne({ _id: moduleId, batchId }).select('_id');
    if (!parentModule) return res.status(400).json({ success: false, message: 'Module does not belong to this batch' });
    const maxOrder = await Section.find({ moduleId }).countDocuments();

    const section = await Section.create({
      batchId,
      moduleId,
      title,
      order: order !== undefined ? order : maxOrder,
    });

    return res.status(201).json({ success: true, data: section });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create section' });
  }
};

export const updateSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingSection = await Section.findById(id);
    if (!existingSection) return res.status(404).json({ success: false, message: 'Section not found' });
    if (!(await teacherCanManageBatch(req, existingSection.batchId.toString()))) return denyContentAccess(res);
    const section = await Section.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json({ success: true, data: section });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update section' });
  }
};

export const deleteSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingSection = await Section.findById(id);
    if (!existingSection) return res.status(404).json({ success: false, message: 'Section not found' });
    if (!(await teacherCanManageBatch(req, existingSection.batchId.toString()))) return denyContentAccess(res);
    await Lesson.deleteMany({ sectionId: id });
    await Section.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Section and nested lessons deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete section' });
  }
};

// --- LESSON CRUD ---
export const createLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      batchId,
      moduleId,
      sectionId,
      title,
      order,
      description,
      youtubeVideoId,
      resources,
      isPublished,
    } = req.body;

    if (!(await teacherCanManageBatch(req, batchId))) return denyContentAccess(res);
    const parentModule = await Module.findOne({ _id: moduleId, batchId }).select('_id');
    if (!parentModule) return res.status(400).json({ success: false, message: 'Module does not belong to this batch' });
    if (sectionId) {
      const parentSection = await Section.findOne({ _id: sectionId, moduleId, batchId }).select('_id');
      if (!parentSection) return res.status(400).json({ success: false, message: 'Section does not belong to this module' });
    }

    const maxOrder = await Lesson.find({ moduleId }).countDocuments();

    const lesson = await Lesson.create({
      batchId,
      moduleId,
      sectionId,
      title,
      order: order !== undefined ? order : maxOrder,
      description: description || '',
      youtubeVideoId,
      resources: resources || [],
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    return res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create lesson' });
  }
};

export const updateLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingLesson = await Lesson.findById(id);
    if (!existingLesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    if (!(await teacherCanManageBatch(req, existingLesson.batchId.toString()))) return denyContentAccess(res);
    const lesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update lesson' });
  }
};

export const deleteLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingLesson = await Lesson.findById(id);
    if (!existingLesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    if (!(await teacherCanManageBatch(req, existingLesson.batchId.toString()))) return denyContentAccess(res);
    await Lesson.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error: any) {
    console.error('deleteLesson error:', error);
    return res.status(500).json({ success: false, message: error?.message || 'Failed to delete lesson' });
  }
};

// --- REORDERING APIS ---
export const reorderModules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body; // Array of { id: string, order: number }
    const ids = Array.isArray(items) ? items.map((item) => item.id) : [];
    const modules = await Module.find({ _id: { $in: ids } }).select('batchId');
    const batchIds = [...new Set(modules.map((module) => module.batchId.toString()))];
    if (modules.length !== ids.length || batchIds.length !== 1 || !(await teacherCanManageBatch(req, batchIds[0]))) {
      return denyContentAccess(res);
    }
    for (const item of items) {
      await Module.findByIdAndUpdate(item.id, { order: item.order });
    }
    return res.status(200).json({ success: true, message: 'Modules reordered successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reorder modules' });
  }
};

export const reorderLessons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body; // Array of { id: string, order: number }
    const ids = Array.isArray(items) ? items.map((item) => item.id) : [];
    const lessons = await Lesson.find({ _id: { $in: ids } }).select('batchId');
    const batchIds = [...new Set(lessons.map((lesson) => lesson.batchId.toString()))];
    if (lessons.length !== ids.length || batchIds.length !== 1 || !(await teacherCanManageBatch(req, batchIds[0]))) {
      return denyContentAccess(res);
    }
    for (const item of items) {
      await Lesson.findByIdAndUpdate(item.id, { order: item.order });
    }
    return res.status(200).json({ success: true, message: 'Lessons reordered successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reorder lessons' });
  }
};
