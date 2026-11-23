import crypto from 'crypto';
import mongoose from 'mongoose';
import { EmailVerificationToken } from '../models/EmailVerificationToken';

const publicAppUrl = () =>
  (process.env.PUBLIC_APP_URL || 'https://gravacademy.com').replace(/\/+$/, '');

export const createEmailVerification = async (target: {
  accountId?: mongoose.Types.ObjectId;
  enrollmentRequestId?: mongoose.Types.ObjectId;
}) => {
  if (Boolean(target.accountId) === Boolean(target.enrollmentRequestId)) {
    throw new Error('Email verification must target exactly one account or enrollment request.');
  }

  await EmailVerificationToken.deleteMany({ ...target, usedAt: { $exists: false } });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await EmailVerificationToken.create({
    ...target,
    tokenHash,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  return {
    rawToken,
    verificationUrl: `${publicAppUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`,
  };
};
