import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { ShowcaseItem } from '../models/ShowcaseItem';
import { clearPublicCache, getCached } from '../services/publicCache';

const typeSchema = z.enum(['achiever', 'testimonial']);
export const showcaseItemSchema = z.object({
  type: typeSchema,
  name: z.string().trim().min(2, 'নাম আবশ্যক').max(120),
  imageUrl: z.string().trim().max(1000).optional().or(z.literal('')),
  title: z.string().trim().max(180).optional().or(z.literal('')),
  institution: z.string().trim().max(180).optional().or(z.literal('')),
  achievement: z.string().trim().max(360).optional().or(z.literal('')),
  quote: z.string().trim().max(1000).optional().or(z.literal('')),
  relation: z.enum(['student', 'guardian', 'alumni']).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'achiever' && !data.achievement?.trim()) ctx.addIssue({ code: 'custom', path: ['achievement'], message: 'অর্জনের তথ্য দিন' });
  if (data.type === 'testimonial' && !data.quote?.trim()) ctx.addIssue({ code: 'custom', path: ['quote'], message: 'মতামত লিখুন' });
});

const clean = (value?: string) => value?.trim() || undefined;
const invalidate = () => clearPublicCache('showcase:');

export const getPublicShowcase = async (req: Request, res: Response) => {
  try {
    const parsed = typeSchema.safeParse(req.query.type);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid showcase type.' });
    const type = parsed.data;
    const limit = Math.min(type === 'achiever' ? 10 : 12, Math.max(1, Number(req.query.limit) || 10));
    const data = await getCached(`showcase:${type}:${limit}`, () =>
      ShowcaseItem.find({ type, isPublished: true }).sort({ sortOrder: 1, createdAt: -1 }).limit(limit).lean()
    );
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Showcase content load করা যায়নি।' });
  }
};

export const getAdminShowcase = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await ShowcaseItem.find().sort({ type: 1, sortOrder: 1, createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Content load করা যায়নি।' });
  }
};

export const createShowcase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'অননুমোদিত এক্সেস' });
    const item = await ShowcaseItem.create({ ...req.body, imageUrl: clean(req.body.imageUrl), title: clean(req.body.title), institution: clean(req.body.institution), achievement: clean(req.body.achievement), quote: clean(req.body.quote), createdBy: req.user._id });
    invalidate();
    return res.status(201).json({ success: true, message: 'সফলভাবে যোগ করা হয়েছে।', data: item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Content তৈরি করা যায়নি।' });
  }
};

export const updateShowcase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await ShowcaseItem.findByIdAndUpdate(req.params.id, { ...req.body, imageUrl: clean(req.body.imageUrl), title: clean(req.body.title), institution: clean(req.body.institution), achievement: clean(req.body.achievement), quote: clean(req.body.quote) }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Content পাওয়া যায়নি।' });
    invalidate();
    return res.json({ success: true, message: 'সফলভাবে আপডেট করা হয়েছে।', data: item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Content আপডেট করা যায়নি।' });
  }
};

export const deleteShowcase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await ShowcaseItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Content পাওয়া যায়নি।' });
    invalidate();
    return res.json({ success: true, message: 'সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Content মুছা যায়নি।' });
  }
};
