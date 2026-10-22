import { Request, Response } from 'express';
import { z } from 'zod';
import { Module, Section, Lesson } from '../models/ContentHierarchy';
import { AuthenticatedRequest } from '../middleware/auth';

// --- MODULE CRUD ---
export const createModule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId, title, order, isPublished } = req.body;
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
    const section = await Section.findByIdAndUpdate(id, req.body, { new: true });
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    return res.status(200).json({ success: true, data: section });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update section' });
  }
};

export const deleteSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
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
    const lesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true });
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    return res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update lesson' });
  }
};

export const deleteLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
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
    for (const item of items) {
      await Lesson.findByIdAndUpdate(item.id, { order: item.order });
    }
    return res.status(200).json({ success: true, message: 'Lessons reordered successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reorder lessons' });
  }
};
