import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { UserRole, PermissionKey, ROLE_DEFAULT_PERMISSIONS, ROLES } from '../types/roles';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
    }

    const secret = process.env.JWT_SECRET || 'grav_academy_jwt_secret_dev';
    const decoded = jwt.verify(token, secret) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    if (user.status === 'suspended' || user.status === 'deactivated') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended or deactivated. Contact platform administration.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

/**
 * Require specific user role(s)
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Superadmin has universal access
    if (req.user.role === ROLES.SUPERADMIN) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

/**
 * Require specific granular permission(s)
 */
export const requirePermission = (...permissions: PermissionKey[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Superadmin bypasses granular permission checks
    if (req.user.role === ROLES.SUPERADMIN) {
      return next();
    }

    const userDefaultPermissions = ROLE_DEFAULT_PERMISSIONS[req.user.role] || [];
    const userAllPermissions = new Set([
      ...userDefaultPermissions,
      ...(req.user.customPermissions || []),
    ]);

    const hasAllRequired = permissions.every((p) => userAllPermissions.has(p));

    if (!hasAllRequired) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have the required permissions to perform this action.',
      });
    }

    next();
  };
};
