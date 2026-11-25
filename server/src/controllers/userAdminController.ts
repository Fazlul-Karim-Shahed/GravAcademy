import mongoose from 'mongoose';
import crypto from 'crypto';
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
import { EmailVerificationToken } from '../models/EmailVerificationToken';
import { createEmailVerification } from '../services/emailVerification';
import { JobPost } from '../models/JobPost';
import { Payment } from '../models/Payment';
import { AuthenticatedRequest, hasPermission } from '../middleware/auth';
import { generateUniquegravId } from './authController';
import {
  sendWelcomeRegistrationEmail,
  isDisposableEmail,
  hasValidMxRecords,
} from '../services/emailService';
import {
  ROLES,
  UserRole,
  PermissionKey,
  DASHBOARD_PERMISSION_METADATA,
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSIONS,
} from '../types/roles';

export const createStaffSchema = z.object({
  name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(100),
  email: z.string().email('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন'),
  phone: z.string().trim().min(1, 'মোবাইল নম্বর দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  role: z.enum(['teacher', 'guardian', 'employee']),
  linkedGravIds: z.array(z.string()).optional(),
});

/**
 * Get system permissions catalog & default mappings
 */
export const getPermissionsCatalog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        permissions: DASHBOARD_PERMISSION_METADATA,
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
    const isSuperAdmin = req.user?.role === ROLES.SUPERADMIN;

    if (role && role !== 'all') {
      // Do not reveal that a superadmin account exists to other roles.
      if (!isSuperAdmin && role === ROLES.SUPERADMIN) filter._id = { $exists: false };
      else filter.role = role;
    } else if (!isSuperAdmin) {
      filter.role = { $ne: ROLES.SUPERADMIN };
    }
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
    const hasPermManage = hasPermission(caller, PERMISSIONS.PERMISSIONS_MANAGE);

    if (!isSuperAdmin && !isAdmin && !hasPermManage) {
      return res.status(403).json({
        success: false,
        message: 'Only Administrators can modify user roles or assign permissions.',
      });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // A delegated permission editor may configure employee access, but must
    // never be able to turn an account into an admin (or alter non-employees).
    // Full administrators retain the existing user-management behaviour.
    if (!isSuperAdmin && !isAdmin && user.role !== ROLES.EMPLOYEE) {
      return res.status(403).json({
        success: false,
        message: 'Delegated permission editors can manage employee access only.',
      });
    }
    if (!isSuperAdmin && !isAdmin && role && role !== ROLES.EMPLOYEE) {
      return res.status(403).json({
        success: false,
        message: 'Delegated permission editors cannot change account roles.',
      });
    }
    if (!isSuperAdmin && !isAdmin && (user._id.toString() === caller._id.toString() ||
      (Array.isArray(customPermissions) && customPermissions.some((permission: PermissionKey) => !hasPermission(caller, permission))))) {
      return res.status(403).json({ success: false, message: 'You cannot change your own access or grant permissions you do not hold.' });
    }

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
 * Create a Teacher, Guardian, or Employee account (Superadmin or user-management staff).
 * Deliberately excludes 'admin'/'superadmin' here â€” role escalation stays on the dedicated
 * role-change endpoint (updateUserRole), which already enforces the superadmin-only check.
 */
export const createStaffAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const caller = req.user;
    if (!caller) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const isSuperAdmin = caller.role === ROLES.SUPERADMIN;
    const isAdmin = caller.role === ROLES.ADMIN;
    const hasUsersManage = hasPermission(caller, PERMISSIONS.USERS_MANAGE);
    if (!isSuperAdmin && !isAdmin && !hasUsersManage) {
      return res.status(403).json({
        success: false,
        message: 'Only Administrators can create staff accounts.',
      });
    }

    const body = createStaffSchema.parse(req.body);
    const normalizedEmail = body.email.trim().toLowerCase();

    // 1. Check duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে' });
    }

    // 2. Check disposable email domain
    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'অনুগ্রহ করে একটি স্থায়ী ও ভ্যালিড ব্যক্তিগত ইমেইল ব্যবহার করুন (টেম্পোরারি ইমেইল অনুমোদিত নয়)।',
      });
    }

    // 3. Check DNS MX records
    const hasMx = await hasValidMxRecords(normalizedEmail);
    if (!hasMx) {
      return res.status(400).json({
        success: false,
        message: 'ইমেইল ডোমেইনটি সক্রিয় বা সঠিক নয়। অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন।',
      });
    }

    const gravId = await generateUniquegravId();

    let validLinkedGravIds: string[] = [];
    if (body.role === 'guardian' && Array.isArray(body.linkedGravIds) && body.linkedGravIds.length > 0) {
      const validStudents = await User.find({
        $or: [
          { gravId: { $in: body.linkedGravIds } },
          { _id: { $in: body.linkedGravIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
        ],
        role: ROLES.STUDENT,
      }).select('gravId _id');
      validLinkedGravIds = validStudents.map((s) => s.gravId || s._id.toString());
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);

    const user = await User.create({
      gravId,
      name: body.name.trim(),
      email: normalizedEmail,
      phone: body.phone ? body.phone.trim() : undefined,
      passwordHash,
      role: body.role,
      status: 'pending_verification',
      emailVerified: false,
      ...(body.role === 'guardian' && validLinkedGravIds.length > 0
        ? { guardianDetails: { linkedGravIds: validLinkedGravIds } }
        : {}),
    });

    const { rawToken, verificationUrl } = await createEmailVerification({ accountId: user._id });
    const emailSent = await sendWelcomeRegistrationEmail({
      to: normalizedEmail,
      name: body.name.trim(),
      gravId,
      role: body.role,
      password: body.password,
      verificationUrl,
    });

    if (!emailSent) {
      await Promise.all([
        User.deleteOne({ _id: user._id }),
        EmailVerificationToken.deleteOne({ tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex') }),
      ]);
      return res.status(400).json({
        success: false,
        message: 'প্রদত্ত ইমেইল ঠিকানায় verification ও credential email পাঠানো যায়নি। আবার চেষ্টা করুন।',
      });
    }

    await AuditLog.create({
      actorId: caller._id,
      actorEmail: caller.email,
      action: 'STAFF_ACCOUNT_CREATED',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: {
        role: body.role,
        targetEmail: user.email,
        targetName: user.name,
        ...(validLinkedGravIds.length > 0 ? { linkedGravIds: validLinkedGravIds } : {}),
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'অ্যাকাউন্ট তৈরি হয়েছে। login চালু করতে ইমেইলের verification link-এ click করতে হবে।',
      data: { _id: user._id, gravId: user.gravId, name: user.name, role: user.role },
    });
  } catch (error: any) {
    console.error('createStaffAccount error:', error);
    return res.status(500).json({ success: false, message: error?.message || 'অ্যাকাউন্ট তৈরি করা যায়নি' });
  }
};

/**
 * Permanently delete a user
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
 * Link / Unlink students a guardian can view (Superadmin or user-management staff)
 */
export const linkGuardianStudents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { gravIds } = req.body;

    const caller = req.user;
    if (!caller) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const isSuperAdmin = caller.role === ROLES.SUPERADMIN;
    const isAdmin = caller.role === ROLES.ADMIN;
    const hasUsersManage = hasPermission(caller, PERMISSIONS.USERS_MANAGE);
    if (!isSuperAdmin && !isAdmin && !hasUsersManage) {
      return res.status(403).json({
        success: false,
        message: 'Only Administrators can link guardians to students.',
      });
    }

    if (!Array.isArray(gravIds)) {
      return res.status(400).json({ success: false, message: 'gravIds একটি array হতে হবে' });
    }

    const guardian = await User.findById(id);
    if (!guardian) return res.status(404).json({ success: false, message: 'অভিভাবক পাওয়া যায়নি' });
    if (guardian.role !== ROLES.GUARDIAN) {
      return res.status(400).json({ success: false, message: 'এই ইউজার একজন অভিভাবক নন' });
    }

    const validStudents = await User.find({
      $or: [
        { gravId: { $in: gravIds } },
        { _id: { $in: gravIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id)) } },
      ],
      role: ROLES.STUDENT,
    }).select('gravId _id');
    if (validStudents.length !== gravIds.length) {
      return res.status(400).json({ success: false, message: 'এক বা একাধিক শিক্ষার্থী সঠিক নয়' });
    }

    const normalizedGravIds = validStudents.map((s) => s.gravId || s._id.toString());
    const previouslinkedGravIds = guardian.guardianDetails?.linkedGravIds || [];
    guardian.guardianDetails = {
      ...(guardian.guardianDetails || {}),
      linkedGravIds: normalizedGravIds,
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
      message: 'অভিভাবক-শিক্ষার্থী সংযোগ সফলভাবে আপডেট হয়েছে',
      data: populatedGuardian,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to link guardian and students' });
  }
};

/**
 * Get audit logs for callers authorized by the route's permission guard.
 */
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};
