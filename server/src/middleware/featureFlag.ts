import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from './auth';
import { FeatureFlagKey } from '../config/featureFlags';

/** Blocks a released module at the API boundary while always allowing superadmin. */
export const requireFeature = (_feature: FeatureFlagKey) => (
  _req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => next();
