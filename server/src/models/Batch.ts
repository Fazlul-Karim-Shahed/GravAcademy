import mongoose, { Document, Schema } from 'mongoose';

export type BatchStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'archived';

export type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface IScheduleSlot {
  day: DayOfWeek;
  startTime: string; // e.g. "18:00" or "07:30 PM"
  endTime?: string;   // e.g. "19:30" or "09:00 PM"
  topic?: string;     // optional topic or note
}

export interface IBatch extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  courseId: mongoose.Types.ObjectId;
  status: BatchStatus;
  startDate?: Date;
  endDate?: Date;
  enrollmentOpenDate?: Date;
  enrollmentCloseDate?: Date;
  capacity?: number;
  assignedTeachers: mongoose.Types.ObjectId[];
  scheduleText?: string;
  weeklySchedule?: IScheduleSlot[];
  meetingUrl?: string; // Auto-generated or custom Google Meet link for batch classes
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
    startDate: { type: Date },
    endDate: { type: Date },
    enrollmentOpenDate: { type: Date },
    enrollmentCloseDate: { type: Date },
    capacity: { type: Number, min: 0 },
    assignedTeachers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    scheduleText: { type: String, trim: true },
    meetingUrl: { type: String, trim: true },
    weeklySchedule: [
      {
        day: {
          type: String,
          enum: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          required: true,
        },
        startTime: { type: String, required: true, trim: true },
        endTime: { type: String, trim: true },
        topic: { type: String, trim: true, default: 'Lecture Day' },
      },
    ],
    sourceBatchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
  },
  {
    timestamps: true,
  }
);

BatchSchema.index({ courseId: 1, status: 1 });

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
