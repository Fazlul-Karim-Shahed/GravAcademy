import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { JobPost } from '../models/JobPost';
import { JobCategory } from '../models/JobCategory';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper function to create URL-safe slug from title
const generateSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\u0980-\u09FFa-zA-Z0-9\s-]/g, '') // keep Bengali & alphanumeric characters
    .replace(/\s+/g, '-')
    .slice(0, 150);

  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${randomSuffix}`;
};

export const jobPostSchema = z.object({
  title: z.string().min(3, 'সার্কুলারের শিরোনাম আবশ্যক'),
  organizationName: z.string().min(2, 'প্রতিষ্ঠানের নাম আবশ্যক'),
  organizationLogo: z.string().optional().or(z.literal('')),
  sector: z.string().min(1).default('govt'),
  category: z.string().optional().or(z.literal('')),
  postName: z.string().min(2, 'পদের নাম আবশ্যক'),
  vacancyCount: z.string().optional().or(z.literal('')),
  salaryScale: z.string().optional().or(z.literal('')),
  educationalQualification: z.string().optional().or(z.literal('')),
  experienceRequired: z.string().optional().or(z.literal('')),
  ageLimit: z.string().optional().or(z.literal('')),
  applicationFee: z.string().optional().or(z.literal('')),
  publishDate: z.string().optional().or(z.literal('')),
  applicationStartDate: z.string().optional().or(z.literal('')),
  applicationDeadline: z.string().optional().or(z.literal('')),
  sourceOrNewspaper: z.string().optional().or(z.literal('')),
  officialWebsite: z.string().optional().or(z.literal('')),
  circularImageUrl: z.string().optional().or(z.literal('')),
  circularPdfUrl: z.string().optional().or(z.literal('')),
  shortDescription: z.string().optional().or(z.literal('')),
  fullDescriptionHtml: z.string().optional().or(z.literal('')),
  customFields: z
    .array(
      z.object({
        label: z.string().min(1, 'হেডলাইন আবশ্যক'),
        value: z.string().min(1, 'বিবরণ আবশ্যক'),
      })
    )
    .optional(),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
  featured: z.boolean().optional().default(false),
});

/**
 * Public: Get All Job Circulars with filters, search, and pagination
 */
export const getPublicJobPosts = async (req: Request, res: Response) => {
  try {
    const { sector, category, search, page = 1, limit = 12 } = req.query;

    const filter: any = { status: 'published' };

    if (sector && sector !== 'all') {
      filter.sector = sector;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { organizationName: regex },
        { postName: regex },
        { category: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await JobPost.countDocuments(filter);
    const jobs = await JobPost.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-fullDescriptionHtml')
      .lean();

    return res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: jobs,
    });
  } catch (error: any) {
    console.error('getPublicJobPosts error:', error);
    return res.status(500).json({
      success: false,
      message: 'জব সার্কুলার তালিকা লোড করা সম্ভব হয়নি।',
    });
  }
};

/**
 * Public: Get Single Job Post by Slug or ID
 */
export const getJobPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    let job;
    if (mongoose.Types.ObjectId.isValid(slug)) {
      job = await JobPost.findById(slug).populate('postedBy', 'name role');
    } else {
      job = await JobPost.findOne({ slug }).populate('postedBy', 'name role');
    }

    if (!job) {
      return res.status(404).json({ success: false, message: 'জব সার্কুলারটি পাওয়া যায়নি।' });
    }

    // Increment views count non-blockingly
    JobPost.findByIdAndUpdate(job._id, { $inc: { viewsCount: 1 } }).exec();

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    console.error('getJobPostBySlug error:', error);
    return res.status(500).json({
      success: false,
      message: 'জব সার্কুলার এর বিবরণ লোড করতে সমস্যা হয়েছে।',
    });
  }
};

/**
 * Admin: Get All Job Posts (including drafts, archived) for Table View
 */
export const getAdminJobPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sector, status, search, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (sector && sector !== 'all') {
      filter.sector = sector;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { organizationName: regex },
        { postName: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await JobPost.countDocuments(filter);
    const jobs = await JobPost.find(filter)
      .populate('postedBy', 'name userId role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: jobs,
    });
  } catch (error: any) {
    console.error('getAdminJobPosts error:', error);
    return res.status(500).json({
      success: false,
      message: 'জব সার্কুলার টেবিল লোড করা সম্ভব হয়নি।',
    });
  }
};

/**
 * Admin: Create New Job Post
 */
export const createJobPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত এক্সেস' });
    }

    const {
      title,
      organizationName,
      organizationLogo,
      sector,
      category,
      postName,
      vacancyCount,
      salaryScale,
      educationalQualification,
      experienceRequired,
      ageLimit,
      applicationFee,
      publishDate,
      applicationStartDate,
      applicationDeadline,
      sourceOrNewspaper,
      officialWebsite,
      circularImageUrl,
      circularPdfUrl,
      shortDescription,
      fullDescriptionHtml,
      customFields,
      status,
      featured,
    } = req.body;

    const slug = generateSlug(title);

    const job = await JobPost.create({
      title: title.trim(),
      slug,
      organizationName: organizationName.trim(),
      organizationLogo: organizationLogo?.trim() || undefined,
      sector: sector || 'govt',
      category: category?.trim() || 'সাধারণ সরকারি',
      postName: postName.trim(),
      vacancyCount: vacancyCount?.trim() || 'উল্লেখ নেই',
      salaryScale: salaryScale?.trim() || undefined,
      educationalQualification: educationalQualification?.trim() || undefined,
      experienceRequired: experienceRequired?.trim() || 'প্রযোজ্য নয়',
      ageLimit: ageLimit?.trim() || undefined,
      applicationFee: applicationFee?.trim() || undefined,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      applicationStartDate: applicationStartDate ? new Date(applicationStartDate) : undefined,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
      sourceOrNewspaper: sourceOrNewspaper?.trim() || undefined,
      officialWebsite: officialWebsite?.trim() || undefined,
      circularImageUrl: circularImageUrl?.trim() || undefined,
      circularPdfUrl: circularPdfUrl?.trim() || undefined,
      shortDescription: shortDescription?.trim() || undefined,
      fullDescriptionHtml: fullDescriptionHtml || '',
      customFields: customFields || [],
      status: status || 'published',
      featured: !!featured,
      postedBy: adminUser._id,
    });

    return res.status(201).json({
      success: true,
      message: 'নতুন জব সার্কুলার সফলভাবে প্রকাশ করা হয়েছে!',
      data: job,
    });
  } catch (error: any) {
    console.error('createJobPost error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'জব সার্কুলার তৈরি করা সম্ভব হয়নি।',
    });
  }
};

/**
 * Admin: Update Existing Job Post
 */
export const updateJobPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const job = await JobPost.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'জব সার্কুলারটি পাওয়া যায়নি।' });
    }

    const {
      title,
      organizationName,
      organizationLogo,
      sector,
      category,
      postName,
      vacancyCount,
      salaryScale,
      educationalQualification,
      experienceRequired,
      ageLimit,
      applicationFee,
      publishDate,
      applicationStartDate,
      applicationDeadline,
      sourceOrNewspaper,
      officialWebsite,
      circularImageUrl,
      circularPdfUrl,
      shortDescription,
      fullDescriptionHtml,
      customFields,
      status,
      featured,
    } = req.body;

    if (title && title.trim() !== job.title) {
      job.title = title.trim();
      job.slug = generateSlug(title);
    }

    if (organizationName !== undefined) job.organizationName = organizationName.trim();
    if (organizationLogo !== undefined) job.organizationLogo = organizationLogo?.trim() || undefined;
    if (sector !== undefined) job.sector = sector;
    if (category !== undefined) job.category = category.trim();
    if (postName !== undefined) job.postName = postName.trim();
    if (vacancyCount !== undefined) job.vacancyCount = vacancyCount.trim();
    if (salaryScale !== undefined) job.salaryScale = salaryScale.trim();
    if (educationalQualification !== undefined) job.educationalQualification = educationalQualification.trim();
    if (experienceRequired !== undefined) job.experienceRequired = experienceRequired.trim();
    if (ageLimit !== undefined) job.ageLimit = ageLimit.trim();
    if (applicationFee !== undefined) job.applicationFee = applicationFee.trim();
    if (publishDate !== undefined) job.publishDate = publishDate ? new Date(publishDate) : job.publishDate;
    if (applicationStartDate !== undefined) job.applicationStartDate = applicationStartDate ? new Date(applicationStartDate) : undefined;
    if (applicationDeadline !== undefined) job.applicationDeadline = applicationDeadline ? new Date(applicationDeadline) : undefined;
    if (sourceOrNewspaper !== undefined) job.sourceOrNewspaper = sourceOrNewspaper.trim();
    if (officialWebsite !== undefined) job.officialWebsite = officialWebsite.trim();
    if (circularImageUrl !== undefined) job.circularImageUrl = circularImageUrl.trim();
    if (circularPdfUrl !== undefined) job.circularPdfUrl = circularPdfUrl.trim();
    if (shortDescription !== undefined) job.shortDescription = shortDescription.trim();
    if (fullDescriptionHtml !== undefined) job.fullDescriptionHtml = fullDescriptionHtml;
    if (customFields !== undefined) job.customFields = customFields;
    if (status !== undefined) job.status = status;
    if (featured !== undefined) job.featured = !!featured;

    await job.save();

    return res.status(200).json({
      success: true,
      message: 'জব সার্কুলার সফলভাবে আপডেট করা হয়েছে!',
      data: job,
    });
  } catch (error: any) {
    console.error('updateJobPost error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'জব সার্কুলার আপডেট করা সম্ভব হয়নি।',
    });
  }
};

/**
 * Admin: Delete Job Post
 */
export const deleteJobPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const job = await JobPost.findByIdAndDelete(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'জব সার্কুলারটি পাওয়া যায়নি।' });
    }

    return res.status(200).json({
      success: true,
      message: 'জব সার্কুলার সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('deleteJobPost error:', error);
    return res.status(500).json({
      success: false,
      message: 'জব সার্কুলার ডিলিট করতে সমস্যা হয়েছে।',
    });
  }
};

/**
 * Public & Admin: Get All Job Categories (Initial default is 'govt' / 'সরকারি চাকরি')
 */
export const getJobCategories = async (req: Request, res: Response) => {
  try {
    let categories = await JobCategory.find({ isActive: true }).sort({ order: 1, createdAt: 1 });

    // Seed default 'সরকারি চাকরি' if database is empty
    if (categories.length === 0) {
      await JobCategory.create({
        name: 'সরকারি চাকরি',
        slug: 'govt',
        description: 'বাংলাদেশ সরকারের বিভিন্ন মন্ত্রণালয়, অধিদপ্তর ও পরিদপ্তরের সরকারি নিয়োগ বিজ্ঞপ্তি',
        badgeColor: 'emerald',
        order: 1,
        isActive: true,
      });
      categories = await JobCategory.find({ isActive: true }).sort({ order: 1 });
    }

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error: any) {
    console.error('getJobCategories error:', error);
    return res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি তালিকা লোড করতে সমস্যা হয়েছে।',
    });
  }
};

/**
 * Admin: Create New Job Category
 */
export const createJobCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, description, badgeColor = 'blue', order = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'ক্যাটাগরির নাম আবশ্যক।' });
    }

    const finalSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/\s+/g, '-')
      : name.trim().toLowerCase().replace(/[^\u0980-\u09FFa-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');

    const existing = await JobCategory.findOne({
      $or: [{ name: name.trim() }, { slug: finalSlug }],
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'এই নামে বা স্লাগে ইতিমধ্যে একটি ক্যাটাগরি রয়েছে।' });
    }

    const category = await JobCategory.create({
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() || undefined,
      badgeColor,
      order: Number(order) || 0,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'নতুন ক্যাটাগরি সফলভাবে তৈরি করা হয়েছে!',
      data: category,
    });
  } catch (error: any) {
    console.error('createJobCategory error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'ক্যাটাগরি তৈরি করতে সমস্যা হয়েছে।',
    });
  }
};

/**
 * Admin: Delete Job Category
 */
export const deleteJobCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const count = await JobCategory.countDocuments();
    if (count <= 1) {
      return res.status(400).json({
        success: false,
        message: 'কমপক্ষে একটি ক্যাটাগরি সিস্টেমে থাকা আবশ্যক।',
      });
    }

    const cat = await JobCategory.findByIdAndDelete(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'ক্যাটাগরি পাওয়া যায়নি।' });
    }

    return res.status(200).json({
      success: true,
      message: 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('deleteJobCategory error:', error);
    return res.status(500).json({
      success: false,
      message: 'ক্যাটাগরি ডিলিট করতে সমস্যা হয়েছে।',
    });
  }
};

