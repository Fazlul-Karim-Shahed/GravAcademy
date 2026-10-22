import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicClass extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;           // e.g. "Class 10", "Class 9", "HSC 2026"
  order: number;          // display ordering
  description?: string;
  subjects?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AcademicClassSchema = new Schema<IAcademicClass>(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      unique: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    subjects: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

AcademicClassSchema.index({ order: 1, name: 1 });

export const AcademicClass = mongoose.model<IAcademicClass>('AcademicClass', AcademicClassSchema);
