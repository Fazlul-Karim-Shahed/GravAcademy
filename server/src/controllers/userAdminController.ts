import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  ROLES,
  UserRole,
  ALL_PERMISSIONS_METADATA,
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSIONS,
} from '../types/roles';

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
