import mongoose, { Document, Schema } from 'mongoose';

export type EnrollmentRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface IEnrollmentRequest extends Document {
  _id: mongoose.Types.ObjectId;
  applicantUserId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  schoolOrCollege?: string;
  gradeLevel?: string;
  guardianName?: string;
  guardianPhone?: string;
  message?: string;
  status: EnrollmentRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  approvedEnrollmentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentRequestSchema = new Schema<IEnrollmentRequest>(
  {
    applicantUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    schoolOrCollege: { type: String, trim: true },
    gradeLevel: { type: String, trim: true },
    guardianName: { type: String, trim: true },
    guardianPhone: { type: String, trim: true },
    message: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 500 },
    approvedEnrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
  },
  { timestamps: true }
);

// A student may have only one active request for a batch.
EnrollmentRequestSchema.index(
  { applicantUserId: 1, batchId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

export const EnrollmentRequest = mongoose.model<IEnrollmentRequest>('EnrollmentRequest', EnrollmentRequestSchema);
