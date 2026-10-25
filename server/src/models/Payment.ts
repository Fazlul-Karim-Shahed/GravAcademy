import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'other';
export type PaymentType = 'admission' | 'due_payment' | 'monthly_fee' | 'refund' | 'adjustment' | 'other';
export type PaymentStatus = 'completed' | 'pending' | 'refunded';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  receiptNo: string; // e.g. "REC-261025-001"
  studentId: mongoose.Types.ObjectId;
  enrollmentId?: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  amountPaid: number;
  totalFee?: number;
  dueAmount?: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  transactionId?: string; // e.g. bKash TrxID or Bank Cheque/Txn number
  senderNumber?: string; // Phone number or Bank account from which payment was sent
  documentUrl?: string; // Receipt screenshot or document link
  status: PaymentStatus;
  isManualPaid?: boolean;
  notes?: string;
  collectedBy: mongoose.Types.ObjectId; // Admin or Staff who processed the payment
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    totalFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'other'],
      default: 'cash',
      index: true,
    },
    paymentType: {
      type: String,
      enum: ['admission', 'due_payment', 'monthly_fee', 'refund', 'adjustment', 'other'],
      default: 'admission',
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    senderNumber: {
      type: String,
      trim: true,
    },
    documentUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'refunded'],
      default: 'completed',
      index: true,
    },
    isManualPaid: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ studentId: 1, paidAt: -1 });
PaymentSchema.index({ batchId: 1, paidAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
