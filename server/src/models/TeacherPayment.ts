import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacherPaymentClass {
  classKey: string;
  batchId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  classDate: string;
  startTime: string;
  endTime?: string;
  topic?: string;
  amount: number;
}

export interface ITeacherPayment extends Document {
  receiptNo: string;
  teacherId: mongoose.Types.ObjectId;
  classes: ITeacherPaymentClass[];
  classKeys?: string[];
  courseBreakdown: Array<{ courseId: mongoose.Types.ObjectId; courseName: string; classCount: number; rate: number; subtotal: number }>;
  amountPaid: number;
  amountRevisions?: Array<{ previousAmount: number; newAmount: number; reason: string; changedBy: mongoose.Types.ObjectId; changedAt: Date }>;
  undoneClasses?: Array<ITeacherPaymentClass & { reason: string; undoneBy: mongoose.Types.ObjectId; undoneAt: Date }>;
  voidedAt?: Date;
  voidedBy?: mongoose.Types.ObjectId;
  voidReason?: string;
  voidedClassKeys?: string[];
  notes?: string;
  paidBy: mongoose.Types.ObjectId;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherPaymentSchema = new Schema<ITeacherPayment>({
  receiptNo: { type: String, required: true, unique: true, index: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  classes: [{
    classKey: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    classDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startTime: { type: String, required: true },
    endTime: { type: String, default: '' },
    topic: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
  }],
  classKeys: { type: [String], default: undefined },
  courseBreakdown: [{
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    courseName: { type: String, required: true },
    classCount: { type: Number, required: true, min: 1 },
    rate: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  }],
  amountPaid: { type: Number, required: true, min: 1 },
  amountRevisions: [{
    previousAmount: { type: Number, required: true },
    newAmount: { type: Number, required: true },
    reason: { type: String, required: true, maxlength: 300 },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, required: true },
  }],
  undoneClasses: [{
    classKey: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    classDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, default: '' },
    topic: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, maxlength: 300 },
    undoneBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    undoneAt: { type: Date, required: true },
  }],
  voidedAt: { type: Date },
  voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  voidReason: { type: String, maxlength: 300 },
  voidedClassKeys: { type: [String], default: undefined },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
  paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  paidAt: { type: Date, default: Date.now, required: true },
}, { timestamps: true });

// Each scheduled class occurrence can be included in only one active payment receipt.
TeacherPaymentSchema.index({ classKeys: 1 }, { unique: true, sparse: true, name: 'teacher_payment_class_once' });
TeacherPaymentSchema.index({ teacherId: 1, paidAt: -1 });

export const TeacherPayment = mongoose.model<ITeacherPayment>('TeacherPayment', TeacherPaymentSchema);
