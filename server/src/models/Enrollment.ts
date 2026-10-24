import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  status: 'pending' | 'enrolled' | 'completed' | 'cancelled';
  enrolledAt: Date;
  completedAt?: Date;
  notes?: string;
  batchFee?: number; // Snapshot of course price at the time of student enrollment
  paymentFee?: number;
  paymentStatus?: 'paid' | 'unpaid' | 'partial';
  enrolledBy?: mongoose.Types.ObjectId; // Admin who enrolled
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'enrolled', 'completed', 'cancelled'],
      default: 'enrolled',
      index: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
    batchFee: {
      type: Number,
      min: 0,
    },
    paymentFee: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid', 'partial'],
      default: 'paid',
    },
    enrolledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Prevent duplicate enrollments for the same student in the same batch
EnrollmentSchema.index({ studentId: 1, batchId: 1 }, { unique: true });
EnrollmentSchema.index({ batchId: 1, status: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
