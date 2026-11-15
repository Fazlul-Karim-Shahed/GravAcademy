import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { PasswordResetToken } from '../models/PasswordResetToken';
import {
  sendPasswordResetEmail,
  sendWelcomeRegistrationEmail,
  isDisposableEmail,
  hasValidMxRecords,
} from '../services/emailService';
import { ROLES, getEffectivePermissions } from '../types/roles';
import { AuthenticatedRequest } from '../middleware/auth';

// Validation Schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস লিখুন।'),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Grav ID or Email is required').optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32, 'Invalid reset token'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const generateToken = (accountId: string): string => {
  const secret = process.env.JWT_SECRET || 'grav_academy_jwt_secret_dev';
  return jwt.sign({ accountId }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
};

/**
 * Generate unique Grav ID in format: YYMMDD### (e.g. 261024001)
 */
export const generateUniquegravId = async (): Promise<string> => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `${yy}${mm}${dd}`; // e.g. "261024"

  // Find users created with this prefix to determine next sequence number
  const regex = new RegExp(`^${prefix}(\\d{3})$`);
  const todaysUsers = await User.find({ gravId: regex }).select('gravId').sort({ gravId: -1 }).limit(1);

  let nextSeq = 1;
  if (todaysUsers.length > 0 && todaysUsers[0].gravId) {
    const lastSeqStr = todaysUsers[0].gravId.slice(-3);
    const lastSeqNum = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSeqNum)) {
      nextSeq = lastSeqNum + 1;
    }
  }

  let candidateId = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  // Ensure uniqueness in case of race condition
  let attempts = 0;
  while (await User.exists({ gravId: candidateId })) {
    nextSeq++;
    candidateId = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    attempts++;
    if (attempts > 100) break;
  }

  return candidateId;
};

/**
 * Public Registration: MANDATORY Student Role with Unique Grav ID
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'অ্যাকাউন্ট খোলার জন্য একটি সক্রিয় ও সঠিক ইমেইল এড্রেস আবশ্যক।',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।',
      });
    }

    // Check disposable email domain
    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'অনুগ্রহ করে একটি স্থায়ী ও ভ্যালিড ব্যক্তিগত ইমেইল ব্যবহার করুন (টেম্পোরারি ইমেইল অনুমোদিত নয়)।',
      });
    }

    // Check DNS MX records of the email domain
    const hasMx = await hasValidMxRecords(normalizedEmail);
    if (!hasMx) {
      return res.status(400).json({
        success: false,
        message: 'ইমেইল ডোমেইনটি সক্রিয় বা সঠিক নয়। অনুগ্রহ করে আপনার সঠিক ইমেইল এড্রেস লিখুন।',
      });
    }

    // Generate unique Grav ID (e.g. 261024001)
    const gravId = await generateUniquegravId();

    // Send Welcome & Verification Email BEFORE saving to DB
    const emailSent = await sendWelcomeRegistrationEmail({
      to: normalizedEmail,
      name: name.trim(),
      gravId,
    });

    if (!emailSent) {
      return res.status(400).json({
        success: false,
        message: 'এই ইমেইল ঠিকানায় ওয়েলকাম বা ভেরিফিকেশন ইমেইল পাঠানো সম্ভব হয়নি। ইমেইলটি সঠিক ও সক্রিয় কি না নিশ্চিত হয়ে আবার চেষ্টা করুন।',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // SECURITY PRINCIPLE: All public signups are assigned the STUDENT role by default.
    // Insert into DB ONLY after email is verified as successfully sent!
    const user = await User.create({
      gravId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone && phone.trim() ? phone.trim() : undefined,
      role: ROLES.STUDENT,
      status: 'active',
      emailVerified: true,
    });

    const token = generateToken(user._id.toString());

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email || user.gravId,
      action: 'USER_REGISTER',
      resourceType: 'User',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'রেজিস্ট্রেশন সফল হয়েছে! আপনার ইমেইলে একটি কনফার্মেশন পাঠানো হয়েছে।',
      data: {
        token,
        user: {
          id: user._id,
          gravId: user.gravId,
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
 * User Login: Supports either Grav ID or Email
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, email, password } = req.body;
    const loginQuery = (identifier || email || '').trim();

    if (!loginQuery) {
      return res.status(400).json({
        success: false,
        message: 'Grav ID অথবা ইমেইল এড্রেস লিখুন।',
      });
    }

    // Search by either unique Grav ID or email
    const user = await User.findOne({
      $or: [
        { gravId: loginQuery },
        { email: loginQuery.toLowerCase() },
      ],
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'সঠিক Grav ID/ইমেইল অথবা পাসওয়ার্ড দিন।',
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
        message: 'সঠিক Grav ID/ইমেইল অথবা পাসওয়ার্ড দিন।',
      });
    }

    const token = generateToken(user._id.toString());

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email || user.gravId,
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
          gravId: user.gravId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          customPermissions: user.customPermissions,
          revokedPermissions: user.revokedPermissions,
          effectivePermissions: getEffectivePermissions(user.role, user.customPermissions, user.revokedPermissions),
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * Request a password reset email for an active account.
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email, status: 'active' });

    if (!user?.email) {
      return res.status(400).json({
        success: false,
        message: 'এই email address দিয়ে কোনো active account পাওয়া যায়নি। Emailটি ঠিক আছে কি না দেখুন।',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await PasswordResetToken.deleteMany({ accountId: user._id, usedAt: { $exists: false } });
    await PasswordResetToken.create({
      accountId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    const emailSent = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
    });

    if (!emailSent) {
      await PasswordResetToken.deleteOne({ tokenHash });
      return res.status(400).json({
        success: false,
        message: 'এই email address-এ reset link পাঠানো যায়নি। Emailটি ঠিক আছে কি না দেখে আবার চেষ্টা করুন।',
      });
    }

    return res.json({
      success: true,
      message: 'Password reset link আপনার email-এ পাঠানো হয়েছে।',
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({ success: false, message: 'Reset link পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।' });
  }
};

/**
 * Consume a one-time password reset token.
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'এই password reset linkটি invalid বা expired। নতুন link নিন।',
      });
    }

    const user = await User.findById(resetRecord.accountId).select('+passwordHash');
    if (!user || user.status === 'suspended' || user.status === 'deactivated') {
      return res.status(400).json({ success: false, message: 'এই account-এ password reset করা যাচ্ছে না।' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    resetRecord.usedAt = new Date();
    await resetRecord.save();
    await PasswordResetToken.deleteMany({ accountId: user._id, _id: { $ne: resetRecord._id } });

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email || user.gravId,
      action: 'PASSWORD_RESET',
      resourceType: 'User',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, message: 'Password সফলভাবে পরিবর্তন হয়েছে। এখন নতুন password দিয়ে login করুন।' });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ success: false, message: 'Password পরিবর্তন করা যায়নি।' });
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
          gravId: user.gravId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          teacherDetails: user.teacherDetails,
          studentDetails: user.studentDetails,
          customPermissions: user.customPermissions,
          revokedPermissions: user.revokedPermissions,
          effectivePermissions: getEffectivePermissions(user.role, user.customPermissions, user.revokedPermissions),
          guardianDetails: user.guardianDetails,
          employeeDetails: user.employeeDetails,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Get authenticated user error:', error);
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
          gravId: user.gravId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          teacherDetails: user.teacherDetails,
          studentDetails: user.studentDetails,
          customPermissions: user.customPermissions,
          revokedPermissions: user.revokedPermissions,
          effectivePermissions: getEffectivePermissions(user.role, user.customPermissions, user.revokedPermissions),
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
      .select('name gravId avatarUrl bio teacherDetails createdAt')
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

    const sanitizedName = `avatar_${req.user.gravId || req.user._id}_${Date.now()}.${file.mimetype.split('/')[1] || 'jpg'}`;

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

    // Google Drive direct image viewable URL (using CDN for embeddability)
    const avatarUrl = isDriveConfigured
      ? `https://lh3.googleusercontent.com/d/${driveFileId}`
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

