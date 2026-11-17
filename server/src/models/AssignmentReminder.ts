import mongoose, { Schema } from 'mongoose';

const AssignmentReminderSchema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  gravId: { type: String, required: true },
  dueDate: { type: Date, required: true },
}, { timestamps: true });

AssignmentReminderSchema.index({ assignmentId: 1, gravId: 1, dueDate: 1 }, { unique: true });

export const AssignmentReminder = mongoose.model('AssignmentReminder', AssignmentReminderSchema);
