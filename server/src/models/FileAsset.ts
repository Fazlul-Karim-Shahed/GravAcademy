import mongoose, { Document, Schema } from 'mongoose';

export interface IFileAsset extends Document {
  _id: mongoose.Types.ObjectId;
  originalName: string;
  sanitizedName: string;
  mimeType: string;
  sizeBytes: number;
  googleDriveFileId: string;
  googleDriveFolderId?: string;
  uploaderId: mongoose.Types.ObjectId;
  referenceCount: number; // Increment on batch copy, decrement on delete
  createdAt: Date;
  updatedAt: Date;
}

const FileAssetSchema = new Schema<IFileAsset>(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    sanitizedName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    googleDriveFileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    googleDriveFolderId: {
      type: String,
    },
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referenceCount: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const FileAsset = mongoose.model<IFileAsset>('FileAsset', FileAssetSchema);
