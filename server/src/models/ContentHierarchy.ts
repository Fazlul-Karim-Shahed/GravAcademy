import mongoose, { Document, Schema } from 'mongoose';

// --- Module ---
export interface IModule extends Document {
  _id: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  title: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ModuleSchema.index({ batchId: 1, order: 1 });
export const Module = mongoose.model<IModule>('Module', ModuleSchema);

// --- Section ---
export interface ISection extends Document {
  _id: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

SectionSchema.index({ moduleId: 1, order: 1 });
export const Section = mongoose.model<ISection>('Section', SectionSchema);

// --- Lesson ---
export interface ILessonResource {
  _id?: mongoose.Types.ObjectId;
  title: string;
  type: 'pdf' | 'worksheet' | 'link';
  fileAssetId?: mongoose.Types.ObjectId;
  externalUrl?: string;
}

export interface ILesson extends Document {
  _id: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId;
  title: string;
  order: number;
  description?: string;
  youtubeVideoId?: string; // Storing clean YouTube video ID, e.g. "dQw4w9WgXcQ"
  videoDurationSeconds?: number;
  resources: ILessonResource[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    description: { type: String, default: '' },
    youtubeVideoId: { type: String, trim: true },
    videoDurationSeconds: { type: Number, default: 0 },
    resources: [
      {
        title: { type: String, required: true },
        type: { type: String, enum: ['pdf', 'worksheet', 'link'], default: 'pdf' },
        fileAssetId: { type: Schema.Types.ObjectId, ref: 'FileAsset' },
        externalUrl: { type: String },
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

LessonSchema.index({ batchId: 1, order: 1 });
LessonSchema.index({ moduleId: 1, order: 1 });
export const Lesson = mongoose.model<ILesson>('Lesson', LessonSchema);
