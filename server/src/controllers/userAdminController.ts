import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateUniqueUserId } from './authController';
import {
  ROLES,
  UserRole,
  ALL_PERMISSIONS_METADATA,
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSIONS,
} from '../types/roles';

export const createStaffSchema = z
  .object({
    name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(100),
    email: z.string().email('সঠিক ইমেইল ঠিকানা দিন').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
    role: z.enum(['teacher', 'guardian', 'employee']),
  })
  .refine((data) => (data.email && data.email.trim() !== '') || (data.phone && data.phone.trim() !== ''), {
    message: 'অ্যাকাউন্ট খোলার জন্য একটি ইমেইল অথবা ফোন নম্বর আবশ্যক।',
    path: ['email'],
  });

/**
 * Get system permissions catalog & default mappings
 */
export const getPermissionsCatalog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        permissions: ALL_PERMISSIONS_METADATA,
        roleDefaults: ROLE_DEFAULT_PERMISSIONS,
        roles: Object.values(ROLES),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions catalog' });
  }
};

/**
 * List all users with optional role and search filters (Superadmin, Admin)
 */
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, search, page = '1', limit = '10' } = req.query;
    const filter: any = {};

    if (role && role !== 'all') filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
        { userId: { $regex: search as string, $options: 'i' } },
        { phone: { $regex: search as string, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: users.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

/**
 * Get single user by ID (Superadmin, Admin)
 */
export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

/**
 * Update User Role or Custom Permissions (Superadmin or Admin with permissions.manage)
 */
export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, customPermissions, status } = req.body;

    const caller = req.user;
    if (!caller) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Permissions check: Superadmin, Admin, or user with PERMISSIONS_MANAGE
    const isSuperAdmin = caller.role === ROLES.SUPERADMIN;
    const isAdmin = caller.role === ROLES.ADMIN;
    const hasPermManage = caller.customPermissions?.includes(PERMISSIONS.PERMISSIONS_MANAGE);

    if (!isSuperAdmin && !isAdmin && !hasPermManage) {
      return res.status(403).json({
        success: false,
        message: 'Only Administrators can modify user roles or assign permissions.',
      });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Only Superadmin can promote to or alter Superadmin
    if (role === ROLES.SUPERADMIN && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only a Superadmin can assign or modify the Superadmin role.',
      });
    }

    // Protect Superadmin self-deactivation
    if (user._id.toString() === caller._id.toString() && role && role !== ROLES.SUPERADMIN && isSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Superadmin cannot revoke their own Superadmin status.',
      });
    }

    const previousRole = user.role;
    if (role) user.role = role as UserRole;
    if (customPermissions !== undefined) user.customPermissions = customPermissions;
    if (status) user.status = status;

    await user.save();

    await AuditLog.create({
      actorId: caller._id,
      actorEmail: caller.email,
      action: 'USER_ROLE_AND_PERMISSIONS_CHANGE',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: {
        previousRole,
        newRole: user.role,
        targetEmail: user.email,
        customPermissions: user.customPermissions,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'User role and permissions updated successfully',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

/**
 * Create a Teacher, Guardian, or Employee account (Superadmin, Admin, or user with permissions.manage).
 * Deliberately excludes 'admin'/'superadmin' here — role escalation stays on the dedicated
 * role-change endpoint (updateUserRole), which already enforces the superadmin-only check.
 */
export const createStaffAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const caller = req.user;
    if (!caller) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const isSuperAdmin = caller.role === ROLES.SUPERADMIN;
    const isAdmin = caller.role === ROLES.ADMIN;
    const hasPermManage = caller.customPermissions?.includes(PERMISSIONS.PERMISSIONS_MANAGE);
    if (!isSuperAdmin && !isAdmin && !hasPermManage) {
      return res.status(403).json({
        success: false,
        message: 'Only Administrators can create staff accounts.',
      });
    }

    const body = createStaffSchema.parse(req.body);

    if (body.email) {
      const existing = await User.findOne({ email: body.email.trim().toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে' });
      }
    }

    const userId = await generateUniqueUserId();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);

    const user = await User.create({
      userId,
      name: body.name.trim(),
      email: body.email && body.email.trim() ? body.email.trim().toLowerCase() : undefined,
      phone: body.phone ? body.phone.trim() : undefined,
      passwordHash,
      role: body.role,
      status: 'active',
    });

    await AuditLog.create({
      actorId: caller._id,
      actorEmail: caller.email,
      action: 'STAFF_ACCOUNT_CREATED',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: { role: body.role, targetEmail: user.email, targetName: user.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'অ্যাকাউন্ট সফলভাবে তৈরি করা হয়েছে',
      data: { _id: user._id, userId: user.userId, name: user.name, role: user.role },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0]?.message || 'Invalid data' });
    }
    console.error('createStaffAccount error:', error);
    return res.status(500).json({ success: false, message: 'অ্যাকাউন্ট তৈরি করা যায়নি' });
  }
};

/**
 * Link / Unlink students a guardian can view (Superadmin, Admin, or user with permissions.manage)
 */
export const linkGuardianStudents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    const caller = req.user;
    if (!caller) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const isSuperAdmin = caller.role === ROLES.SUPERADMIN;
    const isAdmin = caller.role === ROLES.ADMIN;
    const hasPermManage = caller.customPermissions?.includes(PERMISSIONS.PERMISSIONS_MANAGE);
    if (!isSuperAdmin && !isAdmin && !hasPermManage) {
      return res.status(403).json({
        success: false,
        message: 'Only Administrators can link guardians to students.',
      });
    }

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'studentIds একটি array হতে হবে' });
    }

    const guardian = await User.findById(id);
    if (!guardian) return res.status(404).json({ success: false, message: 'অভিভাবক পাওয়া যায়নি' });
    if (guardian.role !== ROLES.GUARDIAN) {
      return res.status(400).json({ success: false, message: 'এই ইউজার একজন অভিভাবক নন' });
    }

    const validStudents = await User.find({ _id: { $in: studentIds }, role: ROLES.STUDENT }).select('_id');
    if (validStudents.length !== studentIds.length) {
      return res.status(400).json({ success: false, message: 'এক বা একাধিক শিক্ষার্থী আইডি সঠিক নয়' });
    }

    const previousLinkedStudents = guardian.guardianDetails?.linkedStudents || [];
    guardian.guardianDetails = {
      ...(guardian.guardianDetails || {}),
      linkedStudents: studentIds,
    } as typeof guardian.guardianDetails;
    await guardian.save();

    await AuditLog.create({
      actorId: caller._id,
      actorEmail: caller.email,
      action: 'GUARDIAN_STUDENT_LINK_UPDATE',
      resourceType: 'User',
      resourceId: guardian._id.toString(),
      metadata: {
        targetEmail: guardian.email,
        previousLinkedStudents,
        newLinkedStudents: studentIds,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const populatedGuardian = await User.findById(id)
      .select('-passwordHash')
      .populate('guardianDetails.linkedStudents', 'name userId avatarUrl phone');

    return res.status(200).json({
      success: true,
      message: 'অভিভাবক-শিক্ষার্থী সংযোগ সফলভাবে আপডেট হয়েছে',
      data: populatedGuardian,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to link guardian and students' });
  }
};

/**
 * Get Audit Logs (Superadmin only)
 */
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== ROLES.SUPERADMIN) {
      return res.status(403).json({ success: false, message: 'Superadmin access required' });
    }

    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};
