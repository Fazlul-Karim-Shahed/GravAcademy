import mongoose, { Document, Schema } from 'mongoose';

export type BatchStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'archived';

export interface IBatch extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  courseId: mongoose.Types.ObjectId;
  status: BatchStatus;
  fee?: number;
  startDate?: Date;
  endDate?: Date;
  enrollmentOpenDate?: Date;
  enrollmentCloseDate?: Date;
  capacity?: number;
  assignedTeachers: mongoose.Types.ObjectId[];
  scheduleText?: string;
  sourceBatchId?: mongoose.Types.ObjectId; // Tracking provenance if copied
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      maxlength: 120,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'active', 'completed', 'archived'],
      default: 'draft',
      index: true,
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    enrollmentOpenDate: { type: Date },
    enrollmentCloseDate: { type: Date },
    capacity: { type: Number, min: 0 },
    assignedTeachers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    scheduleText: { type: String, trim: true },
    sourceBatchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
  },
  {
    timestamps: true,
  }
);

BatchSchema.index({ courseId: 1, status: 1 });

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
