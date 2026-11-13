import { NextFunction, Response } from 'express';
import { Setting } from '../models/Setting';
import { AuthenticatedRequest } from './auth';
import { DEFAULT_FEATURE_FLAGS, FeatureFlagKey } from '../config/featureFlags';

/** Blocks a released module at the API boundary while always allowing superadmin. */
export const requireFeature = (feature: FeatureFlagKey) => async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role === 'superadmin') return next();

  try {
    const setting = await Setting.findOne({ key: 'featureFlags' }).lean();
    const flags = { ...DEFAULT_FEATURE_FLAGS, ...(setting?.value || {}) } as Record<FeatureFlagKey, boolean>;
    if (flags[feature] !== false) return next();
    return res.status(404).json({ success: false, message: 'This feature is not currently available.' });
  } catch (error) {
    console.error('Feature flag check failed:', error);
    return res.status(503).json({ success: false, message: 'Feature availability could not be checked.' });
  }
};
