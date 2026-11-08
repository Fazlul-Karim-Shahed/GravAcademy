import mongoose, { Schema } from 'mongoose';

export interface IReceiptCounter {
  _id: string; // date prefix, e.g. REC-261108
  seq: number;
}

const ReceiptCounterSchema = new Schema<IReceiptCounter>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const ReceiptCounter = mongoose.model<IReceiptCounter>('ReceiptCounter', ReceiptCounterSchema);
