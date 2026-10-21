import mongoose, { Document, Schema } from 'mongoose';
import { ROLES, UserRole, PermissionKey } from '../types/roles';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  customPermissions: PermissionKey[];
  status: 'active' | 'pending_verification' | 'suspended' | 'deactivated';
  emailVerified: boolean;
  avatarUrl?: string;
  guardianDetails?: {
    linkedStudents: mongoose.Types.ObjectId[];
  };
  employeeDetails?: {
    department: string;
    assignedTasks: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Do not expose password by default
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
      index: true,
    },
    customPermissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'pending_verification', 'suspended', 'deactivated'],
      default: 'active',
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
    },
    guardianDetails: {
      linkedStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    employeeDetails: {
      department: { type: String },
      assignedTasks: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user search and queries
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ name: 'text', email: 'text' });

export const User = mongoose.model<IUser>('User', UserSchema);
