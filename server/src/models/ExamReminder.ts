import mongoose, { Schema } from 'mongoose';

const ExamReminderSchema = new Schema({
  examId: { type: Schema.Types.ObjectId, ref: 'Examination', required: true },
  gravId: { type: String, required: true },
  startWindow: { type: Date, required: true },
}, { timestamps: true });

ExamReminderSchema.index({ examId: 1, gravId: 1, startWindow: 1 }, { unique: true });

export const ExamReminder = mongoose.model('ExamReminder', ExamReminderSchema);
