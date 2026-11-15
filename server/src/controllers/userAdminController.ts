import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { Assignment, AssignmentSubmission } from '../models/Assignment';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { EnrollmentRequest } from '../models/EnrollmentRequest';
import { Examination, ExamAttempt, Question } from '../models/Examination';
import { LiveClass } from '../models/LiveClass';
import { Announcement } from '../models/Announcement';
import { DiscussionMessage } from '../models/DiscussionMessage';
import { FileAsset } from '../models/FileAsset';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { JobPost } from '../models/JobPost';
import { Payment } from '../models/Payment';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateUniquegravId } from './authController';
import {
  ROLES,
  UserRole,
  PermissionKey,
  ALL_PERMISSIONS_METADATA,
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSIONS,
} from '../types/roles';

export const createStaffSchema = z
  .object({
    name: z.string().min(2, 'à¦¨à¦¾à¦® à¦•à¦®à¦ªà¦•à§à¦·à§‡ à§¨ à¦…à¦•à§à¦·à¦°à§‡à¦° à¦¹à¦¤à§‡ à¦¹à¦¬à§‡').max(100),
    email: z.string().email('à¦¸à¦ à¦¿à¦• à¦‡à¦®à§‡à¦‡à¦² à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦¦à¦¿à¦¨').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    password: z.string().min(6, 'à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦•à¦®à¦ªà¦•à§à¦·à§‡ à§¬ à¦…à¦•à§à¦·à¦°à§‡à¦° à¦¹à¦¤à§‡ à¦¹à¦¬à§‡'),
    role: z.enum(['teacher', 'guardian', 'employee']),
  })
  .refine((data) => (data.email && data.email.trim() !== '') || (data.phone && data.phone.trim() !== ''), {
    message: 'à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦–à§‹à¦²à¦¾à¦° à¦œà¦¨à§à¦¯ à¦à¦•à¦Ÿà¦¿ à¦‡à¦®à§‡à¦‡à¦² à¦…à¦¥à¦¬à¦¾ à¦«à§‹à¦¨ à¦¨à¦®à§à¦¬à¦° à¦†à¦¬à¦¶à§à¦¯à¦•à¥¤',
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
        { gravId: { $regex: search as string, $options: 'i' } },
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
    const { role, customPermissions, revokedPermissions, status } = req.body;

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
    const validPermissionKeys = new Set(Object.values(PERMISSIONS));
    if (customPermissions !== undefined) {
      user.customPermissions = Array.from(new Set(
        (Array.isArray(customPermissions) ? customPermissions : []).filter((permission): permission is PermissionKey => validPermissionKeys.has(permission)),
      ));
    }
    if (revokedPermissions !== undefined) {
      user.revokedPermissions = Array.from(new Set(
        (Array.isArray(revokedPermissions) ? revokedPermissions : []).filter((permission): permission is PermissionKey => validPermissionKeys.has(permission)),
      ));
    }
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
        revokedPermissions: user.revokedPermissions,
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
 * Deliberately excludes 'admin'/'superadmin' here â€” role escalation stays on the dedicated
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
        return res.status(400).json({ success: false, message: 'à¦à¦‡ à¦‡à¦®à§‡à¦‡à¦² à¦¦à¦¿à¦¯à¦¼à§‡ à¦‡à¦¤à¦¿à¦®à¦§à§à¦¯à§‡ à¦à¦•à¦Ÿà¦¿ à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦†à¦›à§‡' });
      }
    }

    const gravId = await generateUniquegravId();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);

    const user = await User.create({
      gravId,
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
      message: 'à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡',
      data: { _id: user._id, gravId: user.gravId, name: user.name, role: user.role },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0]?.message || 'Invalid data' });
    }
    console.error('createStaffAccount error:', error);
    return res.status(500).json({ success: false, message: 'à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿' });
  }
};

/**
 * Permanently delete a user and the platform records owned by that user.
 *
 * This is intentionally stricter than the generic USERS_MANAGE permission:
 * only an admin/superadmin may delete, self-deletion is blocked, and the
 * superadmin account can never be removed. Financial payments are retained
 * when the deleted account was only the collector; their collector reference
 * is cleared so the financial history is not silently destroyed.
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const caller = req.user;

  if (!caller) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
  if (![ROLES.ADMIN, ROLES.SUPERADMIN].includes(caller.role as typeof ROLES.ADMIN | typeof ROLES.SUPERADMIN)) {
    return res.status(403).json({ success: false, message: 'Only administrators can delete users' });
  }

  const session = await mongoose.startSession();
  try {
    let deletedRole = '';
    let targetEmail = '';
    let counts = {
      enrollments: 0,
      studentPayments: 0,
      assignments: 0,
      assignmentSubmissions: 0,
      examinations: 0,
      questions: 0,
      examAttempts: 0,
      liveClasses: 0,
      announcements: 0,
      discussionMessages: 0,
      enrollmentRequests: 0,
      fileAssets: 0,
      passwordResetTokens: 0,
      jobPosts: 0,
      auditLogs: 0,
      financeCollectorLinksCleared: 0,
    };

    await session.withTransaction(async () => {
      const target = await User.findById(id).session(session);
      if (!target) {
        const error = new Error('USER_NOT_FOUND');
        throw error;
      }

      if (target._id.toString() === caller._id.toString()) {
        throw new Error('CANNOT_DELETE_SELF');
      }
      if (target.role === ROLES.SUPERADMIN) {
        throw new Error('CANNOT_DELETE_SUPERADMIN');
      }
      if (target.role === ROLES.ADMIN && caller.role !== ROLES.SUPERADMIN) {
        throw new Error('ONLY_SUPERADMIN_CAN_DELETE_ADMIN');
      }

      const targetId = target._id;
      const targetGravId = target.gravId;
      deletedRole = target.role;
      targetEmail = target.email || '';

      // Student-owned academic and finance records.
      counts.enrollments = (await Enrollment.deleteMany({ gravId: targetGravId }, { session })).deletedCount;
      counts.studentPayments = (await Payment.deleteMany({ gravId: targetGravId }, { session })).deletedCount;
      counts.assignmentSubmissions = (await AssignmentSubmission.deleteMany({ gravId: targetGravId }, { session })).deletedCount;
      counts.examAttempts = (await ExamAttempt.deleteMany({ gravId: targetGravId }, { session })).deletedCount;
      counts.enrollmentRequests += (await EnrollmentRequest.deleteMany({ applicantGravId: targetGravId }, { session })).deletedCount;

      // Teacher-owned work is removed with the account; student work they
      // evaluated stays available, but no longer points at the deleted user.
      const assignments = await Assignment.find({ createdBy: targetId }).select('_id').session(session);
      const assignmentIds = assignments.map((item) => item._id);
      if (assignmentIds.length) {
        counts.assignmentSubmissions += (await AssignmentSubmission.deleteMany({ assignmentId: { $in: assignmentIds } }, { session })).deletedCount;
        counts.assignments = (await Assignment.deleteMany({ _id: { $in: assignmentIds } }, { session })).deletedCount;
      }

      const examinations = await Examination.find({ createdBy: targetId }).select('_id').session(session);
      const examinationIds = examinations.map((item) => item._id);
      if (examinationIds.length) {
        counts.questions = (await Question.deleteMany({ examId: { $in: examinationIds } }, { session })).deletedCount;
        counts.examAttempts += (await ExamAttempt.deleteMany({ examId: { $in: examinationIds } }, { session })).deletedCount;
        counts.examinations = (await Examination.deleteMany({ _id: { $in: examinationIds } }, { session })).deletedCount;
      }

      counts.liveClasses = (await LiveClass.deleteMany({ teacherId: targetId }, { session })).deletedCount;
      counts.announcements = (await Announcement.deleteMany({ authorId: targetId }, { session })).deletedCount;
      counts.discussionMessages = (await DiscussionMessage.deleteMany({ senderId: targetId }, { session })).deletedCount;
      counts.fileAssets = (await FileAsset.deleteMany({ uploaderId: targetId }, { session })).deletedCount;
      counts.passwordResetTokens = (await PasswordResetToken.deleteMany({ accountId: targetId }, { session })).deletedCount;
      counts.jobPosts = (await JobPost.deleteMany({ postedBy: targetId }, { session })).deletedCount;

      // Remove references that should not keep a deleted account ID alive.
      await Batch.updateMany({ assignedTeachers: targetId }, { $pull: { assignedTeachers: targetId } }, { session });
      await Course.updateMany(
        { $or: [{ instructors: targetId }, { 'instructorProfiles.instructorId': targetId }] },
        { $pull: { instructors: targetId, instructorProfiles: { instructorId: targetId } } },
        { session }
      );
      await User.updateMany(
        { 'guardianDetails.linkedGravIds': targetGravId },
        { $pull: { 'guardianDetails.linkedGravIds': targetGravId } },
        { session }
      );
      await Enrollment.updateMany({ enrolledBy: targetId }, { $unset: { enrolledBy: 1 } }, { session });
      await EnrollmentRequest.updateMany({ reviewedBy: targetId }, { $unset: { reviewedBy: 1 } }, { session });
      await AssignmentSubmission.updateMany({ evaluatedBy: targetId }, { $unset: { evaluatedBy: 1 } }, { session });
      await ExamAttempt.updateMany({ evaluatedBy: targetId }, { $unset: { evaluatedBy: 1 } }, { session });
      counts.financeCollectorLinksCleared = (
        await Payment.updateMany({ collectedBy: targetId }, { $unset: { collectedBy: 1 } }, { session })
      ).modifiedCount;

      // Remove logs that contain the deleted account as actor/resource. A new
      // redacted deletion event below preserves the security trail.
      counts.auditLogs = (
        await AuditLog.deleteMany(
          { $or: [{ actorId: targetId }, { resourceId: targetId.toString() }] },
          { session }
        )
      ).deletedCount;

      await User.deleteOne({ _id: targetId }, { session });
      await AuditLog.create(
        [
          {
            actorId: caller._id,
            actorEmail: caller.email,
            action: 'USER_DELETED',
            resourceType: 'User',
            resourceId: 'deleted-user',
            metadata: { deletedRole, targetEmail, counts },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        ],
        { session }
      );
    });

    return res.status(200).json({
      success: true,
      message: 'User and related records were permanently deleted',
      data: { deletedRole, counts },
    });
  } catch (error: any) {
    const code = error?.message;
    if (code === 'USER_NOT_FOUND') return res.status(404).json({ success: false, message: 'User not found' });
    if (code === 'CANNOT_DELETE_SELF') return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    if (code === 'CANNOT_DELETE_SUPERADMIN') return res.status(403).json({ success: false, message: 'The superadmin account cannot be deleted' });
    if (code === 'ONLY_SUPERADMIN_CAN_DELETE_ADMIN') return res.status(403).json({ success: false, message: 'Only the superadmin can delete an admin account' });
    console.error('deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'User deletion failed; no records were changed' });
  } finally {
    await session.endSession();
  }
};

/**
 * Link / Unlink students a guardian can view (Superadmin, Admin, or user with permissions.manage)
 */
export const linkGuardianStudents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { gravIds } = req.body;

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

    if (!Array.isArray(gravIds)) {
      return res.status(400).json({ success: false, message: 'gravIds à¦à¦•à¦Ÿà¦¿ array à¦¹à¦¤à§‡ à¦¹à¦¬à§‡' });
    }

    const guardian = await User.findById(id);
    if (!guardian) return res.status(404).json({ success: false, message: 'à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦• à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿' });
    if (guardian.role !== ROLES.GUARDIAN) {
      return res.status(400).json({ success: false, message: 'à¦à¦‡ à¦‡à¦‰à¦œà¦¾à¦° à¦à¦•à¦œà¦¨ à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦• à¦¨à¦¨' });
    }

    const validStudents = await User.find({ gravId: { $in: gravIds }, role: ROLES.STUDENT }).select('gravId');
    if (validStudents.length !== gravIds.length) {
      return res.status(400).json({ success: false, message: 'à¦à¦• à¦¬à¦¾ à¦à¦•à¦¾à¦§à¦¿à¦• à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦¸à¦ à¦¿à¦• à¦¨à¦¯à¦¼' });
    }

    const previouslinkedGravIds = guardian.guardianDetails?.linkedGravIds || [];
    guardian.guardianDetails = {
      ...(guardian.guardianDetails || {}),
      linkedGravIds: gravIds,
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
        previouslinkedGravIds,
        newlinkedGravIds: gravIds,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const populatedGuardian = await User.findById(id)
      .select('-passwordHash')

    return res.status(200).json({
      success: true,
      message: 'à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•-à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦¸à¦‚à¦¯à§‹à¦— à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦¹à¦¯à¦¼à§‡à¦›à§‡',
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
