import mongoose, { Document, Schema } from 'mongoose';
import { ROLES, UserRole, PermissionKey } from '../types/roles';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  /** Public Grav ID, e.g. 261024001 (DDMMYY + 3 digit serial). */
  gravId: string;
  /** @deprecated Compatibility alias for older application code; not stored in MongoDB. */
  userId: string;
  name: string;
  email?: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  customPermissions: PermissionKey[];
  status: 'active' | 'pending_verification' | 'suspended' | 'deactivated';
  emailVerified: boolean;
  avatarUrl?: string;
  bio?: string;
  teacherDetails?: {
    institution?: string;
    department?: string;
    experience?: string;
    specialistSubjects?: string[];
    badge?: string;
    cvUrl?: string;
    classesCount?: string;
    studentsCount?: string;
  };
  studentDetails?: {
    schoolOrCollege?: string;
    gradeLevel?: string;
    group?: string; // Science, Commerce, Arts
    guardianName?: string;
    guardianPhone?: string;
  };
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
    gravId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
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
    bio: {
      type: String,
      maxlength: 1000,
    },
    teacherDetails: {
      institution: { type: String, trim: true },
      department: { type: String, trim: true },
      experience: { type: String, trim: true },
      specialistSubjects: [{ type: String, trim: true }],
      badge: { type: String, trim: true },
      cvUrl: { type: String, trim: true },
      classesCount: { type: String, trim: true },
      studentsCount: { type: String, trim: true },
    },
    studentDetails: {
      schoolOrCollege: { type: String, trim: true },
      gradeLevel: { type: String, trim: true },
      group: { type: String, trim: true },
      guardianName: { type: String, trim: true },
      guardianPhone: { type: String, trim: true },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep old server call-sites readable during the migration while MongoDB stores
// only the canonical `gravId` field. Queries and writes using the legacy key
// are translated before they reach MongoDB.
UserSchema.virtual('userId')
  .get(function () {
    return this.gravId;
  })
  .set(function (value: string) {
    this.gravId = value;
  });

const rewriteLegacyId = (value: any): any => {
  if (Array.isArray(value)) return value.map(rewriteLegacyId);
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date || value instanceof mongoose.Types.ObjectId || value._bsontype) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key === 'userId' ? 'gravId' : key,
      rewriteLegacyId(child),
    ]),
  );
};

UserSchema.pre(
  ['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'updateMany', 'deleteOne', 'countDocuments'],
  function () {
    this.setQuery(rewriteLegacyId(this.getQuery()));
    const update = this.getUpdate();
    if (update) this.setUpdate(rewriteLegacyId(update));
    const projection = this.projection();
    if (projection) this.select(rewriteLegacyId(projection));
  },
);

// Compound indexes for user search and queries
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ name: 'text', email: 'text', gravId: 'text' });

export const User = mongoose.model<IUser>('User', UserSchema);
