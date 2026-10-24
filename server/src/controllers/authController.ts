import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { ROLES } from '../types/roles';
import { AuthenticatedRequest } from '../middleware/auth';

// Validation Schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => (data.email && data.email.trim() !== '') || (data.phone && data.phone.trim() !== ''), {
  message: 'অ্যাকাউন্ট খোলার জন্য একটি ইমেইল অথবা ফোন নম্বর আবশ্যক।',
  path: ['email'],
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'User ID or Email is required').optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
});

const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'grav_academy_jwt_secret_dev';
  return jwt.sign({ userId }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
};

/**
 * Generate unique User ID in format: YYMMDD### (e.g. 261024001)
 */
export const generateUniqueUserId = async (): Promise<string> => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `${yy}${mm}${dd}`; // e.g. "261024"

  // Find users created with this prefix to determine next sequence number
  const regex = new RegExp(`^${prefix}(\\d{3})$`);
  const todaysUsers = await User.find({ userId: regex }).select('userId').sort({ userId: -1 }).limit(1);

  let nextSeq = 1;
  if (todaysUsers.length > 0 && todaysUsers[0].userId) {
    const lastSeqStr = todaysUsers[0].userId.slice(-3);
    const lastSeqNum = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSeqNum)) {
      nextSeq = lastSeqNum + 1;
    }
  }

  let candidateId = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  // Ensure uniqueness in case of race condition
  let attempts = 0;
  while (await User.exists({ userId: candidateId })) {
    nextSeq++;
    candidateId = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    attempts++;
    if (attempts > 100) break;
  }

  return candidateId;
};

/**
 * Public Registration: MANDATORY Student Role with Unique User ID
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if ((!email || !email.trim()) && (!phone || !phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'অ্যাকাউন্ট খোলার জন্য একটি ইমেইল অথবা একটি ফোন নম্বর প্রয়োজন।',
      });
    }

    // Generate unique User ID (e.g. 261024001)
    const userId = await generateUniqueUserId();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // SECURITY PRINCIPLE: All public signups are assigned the STUDENT role by default.
    const user = await User.create({
      userId,
      name: name.trim(),
      email: email && email.trim() ? email.trim().toLowerCase() : undefined,
      passwordHash,
      phone: phone ? phone.trim() : undefined,
      role: ROLES.STUDENT,
      status: 'active',
      emailVerified: false,
    });

    const token = generateToken(user._id.toString());

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email || user.userId,
      action: 'USER_REGISTER',
      resourceType: 'User',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'রেজিস্ট্রেশন সফল হয়েছে!',
      data: {
        token,
        user: {
          id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * User Login: Supports either User ID or Email
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, email, password } = req.body;
    const loginQuery = (identifier || email || '').trim();

    if (!loginQuery) {
      return res.status(400).json({
        success: false,
        message: 'ইউজার আইডি অথবা ইমেইল এড্রেস লিখুন।',
      });
    }

    // Search by either unique userId OR email
    const user = await User.findOne({
      $or: [
        { userId: loginQuery },
        { email: loginQuery.toLowerCase() },
      ],
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'সঠিক ইউজার আইডি/ইমেইল অথবা পাসওয়ার্ড দিন।',
      });
    }

    if (user.status === 'suspended' || user.status === 'deactivated') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended or deactivated.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'সঠিক ইউজার আইডি/ইমেইল অথবা পাসওয়ার্ড দিন।',
      });
    }

    const token = generateToken(user._id.toString());

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email || user.userId,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Sign in successful.',
      data: {
        token,
        user: {
          id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          customPermissions: user.customPermissions,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * Get Authenticated User Profile
 */
export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          teacherDetails: user.teacherDetails,
          studentDetails: user.studentDetails,
          customPermissions: user.customPermissions,
          guardianDetails: user.guardianDetails,
          employeeDetails: user.employeeDetails,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update Current Authenticated User Profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name,
      phone,
      avatarUrl,
      bio,
      teacherDetails,
      studentDetails,
    } = req.body;

    if (name && typeof name === 'string') {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl.trim();
    }

    if (bio !== undefined) {
      user.bio = typeof bio === 'string' ? bio.slice(0, 1000) : bio;
    }

    // Role-specific profile payload
    if (user.role === 'teacher' && teacherDetails && typeof teacherDetails === 'object') {
      user.teacherDetails = {
        institution: teacherDetails.institution?.trim() || '',
        department: teacherDetails.department?.trim() || '',
        experience: teacherDetails.experience?.trim() || '',
        specialistSubjects: Array.isArray(teacherDetails.specialistSubjects)
          ? teacherDetails.specialistSubjects.filter(Boolean)
          : [],
        badge: teacherDetails.badge?.trim() || 'মেন্টর',
        cvUrl: teacherDetails.cvUrl?.trim() || '',
        classesCount: teacherDetails.classesCount?.trim() || '',
        studentsCount: teacherDetails.studentsCount?.trim() || '',
      };
    }

    if (user.role === 'student' && studentDetails && typeof studentDetails === 'object') {
      user.studentDetails = {
        schoolOrCollege: studentDetails.schoolOrCollege?.trim() || '',
        gradeLevel: studentDetails.gradeLevel?.trim() || '',
        group: studentDetails.group?.trim() || '',
        guardianName: studentDetails.guardianName?.trim() || '',
        guardianPhone: studentDetails.guardianPhone?.trim() || '',
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          teacherDetails: user.teacherDetails,
          studentDetails: user.studentDetails,
          customPermissions: user.customPermissions,
        },
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।' });
  }
};

/**
 * Public endpoint to fetch active teacher profiles (e.g. for homepage instructor roster)
 */
export const getPublicTeachers = async (_req: any, res: Response) => {
  try {
    const teachers = await User.find({ role: 'teacher', status: 'active' })
      .select('name userId avatarUrl bio teacherDetails createdAt')
      .sort({ createdAt: -1 })
      .limit(12);

    return res.status(200).json({
      success: true,
      data: teachers,
    });
  } catch (error: any) {
    console.error('getPublicTeachers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch teachers.' });
  }
};

/**
 * Upload Profile Avatar Photo directly to Google Drive and update user's avatarUrl
 */
export const uploadAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'কোনো ছবি আপলোড করা হয়নি।' });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করা যাবে।',
      });
    }

    const sanitizedName = `avatar_${req.user.userId || req.user._id}_${Date.now()}.${file.mimetype.split('/')[1] || 'jpg'}`;

    let driveFileId = '';
    const isDriveConfigured =
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN;

    if (isDriveConfigured) {
      const { uploadFileToDrive } = await import('../services/googleDriveService');
      const driveRes = await uploadFileToDrive(sanitizedName, file.mimetype, file.buffer);
      driveFileId = driveRes.fileId;
    } else {
      console.warn('⚠️ Google Drive OAuth not configured. Using stub.');
      driveFileId = `stub_drive_${Date.now()}`;
    }

    // Google Drive direct image viewable URL
    const avatarUrl = isDriveConfigured
      ? `https://drive.google.com/uc?export=view&id=${driveFileId}`
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.user.name)}`;

    const user = await User.findById(req.user._id);
    if (user) {
      user.avatarUrl = avatarUrl;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'প্রোফাইল ছবি সফলভাবে ড্রাইভে আপলোড ও সেভ করা হয়েছে!',
      data: {
        avatarUrl,
        driveFileId,
      },
    });
  } catch (error: any) {
    console.error('uploadAvatar error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে।',
    });
  }
};

