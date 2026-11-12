import mongoose, { Document, Schema } from 'mongoose';

// ==========================================
// 1. Assignment Definition
// ==========================================
export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  totalMarks: number;
  passMarks: number;
  dueDate: Date;
  allowLateSubmission: boolean;
  latePenaltyPercent?: number; // e.g. 10% penalty if submitted after dueDate
  attachmentUrl?: string; // Teacher attached PDF / document / prompt sheet
  isPublished: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    totalMarks: { type: Number, required: true, default: 100, min: 1 },
    passMarks: { type: Number, required: true, default: 40, min: 0 },
    dueDate: { type: Date, required: true },
    allowLateSubmission: { type: Boolean, default: false },
    latePenaltyPercent: { type: Number, default: 0, min: 0, max: 100 },
    attachmentUrl: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

AssignmentSchema.index({ batchId: 1, dueDate: 1 });

AssignmentSchema.pre('validate', function (next) {
  if (this.passMarks > this.totalMarks) {
    this.invalidate('passMarks', 'Pass marks cannot exceed total marks');
  }
  next();
});

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);

// ==========================================
// 2. Assignment Submission
// ==========================================
export interface IAssignmentSubmission extends Document {
  _id: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  submissionText?: string;
  fileUrl?: string; // Uploaded student file / homework document
  fileName?: string;
  annotatedFileUrl?: string; // Teacher annotated / graded document copy
  annotatedFileName?: string;
  submittedAt: Date;
  isLate: boolean;
  score?: number; // Teacher graded marks
  rawScore?: number; // Teacher-entered score before any late penalty
  feedback?: string; // Teacher feedback
  isEvaluated: boolean;
  evaluatedBy?: mongoose.Types.ObjectId;
  evaluatedAt?: Date;
  status: 'submitted' | 'evaluated' | 'resubmit_requested';
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    submissionText: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    annotatedFileUrl: { type: String, default: '' },
    annotatedFileName: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    score: { type: Number, min: 0 },
    rawScore: { type: Number, min: 0 },
    feedback: { type: String, default: '' },
    isEvaluated: { type: Boolean, default: false },
    evaluatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    evaluatedAt: { type: Date },
    status: {
      type: String,
      enum: ['submitted', 'evaluated', 'resubmit_requested'],
      default: 'submitted',
    },
  },
  { timestamps: true }
);

// Enforce one submission record per student per assignment (can update if not yet evaluated or resubmit)
AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>(
  'AssignmentSubmission',
  AssignmentSubmissionSchema
);
