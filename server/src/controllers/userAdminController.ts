import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { ROLES, UserRole } from '../types/roles';

/**
 * List all users with optional role and search filters (Superadmin, Admin)
 */
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, search } = req.query;
    const filter: any = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

/**
 * Update User Role or Custom Permissions (Superadmin only)
 */
export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, customPermissions, status } = req.body;

    // Security: Only Superadmin can promote or modify roles
    if (req.user?.role !== ROLES.SUPERADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only the Superadmin can modify user roles or assign permissions.',
      });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Protect Superadmin self-deactivation
    if (user._id.toString() === req.user?._id.toString() && role !== ROLES.SUPERADMIN) {
      return res.status(400).json({
        success: false,
        message: 'Superadmin cannot revoke their own Superadmin status.',
      });
    }

    const previousRole = user.role;
    if (role) user.role = role as UserRole;
    if (customPermissions) user.customPermissions = customPermissions;
    if (status) user.status = status;

    await user.save();

    await AuditLog.create({
      actorId: req.user?._id,
      actorEmail: req.user?.email,
      action: 'USER_ROLE_CHANGE',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: { previousRole, newRole: user.role, targetEmail: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'User permissions updated successfully',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user' });
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
