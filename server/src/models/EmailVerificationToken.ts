import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailVerificationToken extends Document {
  _id: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId;
  enrollmentRequestId?: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    enrollmentRequestId: { type: Schema.Types.ObjectId, ref: 'EnrollmentRequest', index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationToken = mongoose.model<IEmailVerificationToken>(
  'EmailVerificationToken',
  EmailVerificationTokenSchema
);
