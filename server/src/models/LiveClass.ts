import mongoose, { Document, Schema } from 'mongoose';

export interface ILiveClass extends Document {
  _id: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  isFreePublic: boolean;
  provider: 'google_meet' | 'zoom';
  meetingUrl: string;
  meetingPassword?: string;
  startTime: Date;
  durationMinutes: number;
  instructions?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LiveClassSchema = new Schema<ILiveClass>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: false,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    isFreePublic: { type: Boolean, default: false, index: true },
    provider: { type: String, enum: ['google_meet', 'zoom'], default: 'google_meet' },
    meetingUrl: { type: String, required: true, trim: true },
    meetingPassword: { type: String, trim: true },
    startTime: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    instructions: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LiveClassSchema.index({ isFreePublic: 1, startTime: 1 });
LiveClassSchema.index({ batchId: 1, startTime: 1 });

export const LiveClass = mongoose.model<ILiveClass>('LiveClass', LiveClassSchema);
