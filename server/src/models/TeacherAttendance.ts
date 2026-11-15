import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacherAttendance extends Document {
  teacherId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  attendanceDate: string;
  status: 'present';
  source: 'quick' | 'manual';
  markedBy: mongoose.Types.ObjectId;
  markedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherAttendanceSchema = new Schema<ITeacherAttendance>({
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  attendanceDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  status: { type: String, enum: ['present'], default: 'present', required: true },
  source: { type: String, enum: ['quick', 'manual'], required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  markedAt: { type: Date, default: Date.now, required: true },
}, { timestamps: true });

TeacherAttendanceSchema.index({ teacherId: 1, batchId: 1, attendanceDate: 1 }, { unique: true });
TeacherAttendanceSchema.index({ attendanceDate: -1, teacherId: 1 });

export const TeacherAttendance = mongoose.model<ITeacherAttendance>('TeacherAttendance', TeacherAttendanceSchema);
