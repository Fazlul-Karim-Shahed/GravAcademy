import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscussionMessage extends Document {
  _id: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionMessageSchema = new Schema<IDiscussionMessage>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

DiscussionMessageSchema.index({ batchId: 1, createdAt: 1 });

export const DiscussionMessage = mongoose.model<IDiscussionMessage>(
  'DiscussionMessage',
  DiscussionMessageSchema
);
