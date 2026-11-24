import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface IStudentAttendanceRecord {
  studentId: mongoose.Types.ObjectId;
  gravId: string;
  studentName?: string;
  status: AttendanceStatus;
  note?: string;
}

export interface IStudentAttendance extends Document {
  batchId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  topic?: string;
  records: IStudentAttendanceRecord[];
  takenBy: mongoose.Types.ObjectId;
  takenByName: string;
  takenByRole: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentAttendanceRecordSchema = new Schema<IStudentAttendanceRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gravId: { type: String, required: true },
    studentName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'present',
    },
    note: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const StudentAttendanceSchema = new Schema<IStudentAttendance>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    date: { type: String, required: true, trim: true }, // Format: YYYY-MM-DD
    topic: { type: String, trim: true, default: '' },
    records: [StudentAttendanceRecordSchema],
    takenBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    takenByName: { type: String, required: true },
    takenByRole: { type: String, required: true },
  },
  { timestamps: true }
);

// One attendance record per batch per date
StudentAttendanceSchema.index({ batchId: 1, date: 1 }, { unique: true });

export const StudentAttendance = mongoose.model<IStudentAttendance>(
  'StudentAttendance',
  StudentAttendanceSchema
);
