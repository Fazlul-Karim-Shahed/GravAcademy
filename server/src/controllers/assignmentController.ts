import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Assignment, AssignmentSubmission, IAssignment } from '../models/Assignment';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { ROLES } from '../types/roles';

// ==========================================
// Validation Schemas
// ==========================================
export const createAssignmentSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().default(''),
  totalMarks: z.number().min(1).default(100),
  passMarks: z.number().min(0).default(40),
  dueDate: z.string().datetime({ message: 'Valid dueDate ISO string is required' }),
  allowLateSubmission: z.boolean().default(false),
  latePenaltyPercent: z.number().min(0).max(100).default(0),
  attachmentUrl: z.string().optional().default(''),
  isPublished: z.boolean().default(true),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  totalMarks: z.number().min(1).optional(),
  passMarks: z.number().min(0).optional(),
  dueDate: z.string().datetime().optional(),
  allowLateSubmission: z.boolean().optional(),
  latePenaltyPercent: z.number().min(0).max(100).optional(),
  attachmentUrl: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export const submitAssignmentSchema = z.object({
  submissionText: z.string().optional().default(''),
  fileUrl: z.string().optional().default(''),
  fileName: z.string().optional().default(''),
});

export const gradeAssignmentSchema = z.object({
  score: z.number().min(0, 'Score cannot be negative'),
  feedback: z.string().optional().default(''),
  annotatedFileUrl: z.string().optional().default(''),
  annotatedFileName: z.string().optional().default(''),
  status: z.enum(['evaluated', 'resubmit_requested']).default('evaluated'),
});

// ==========================================
// Access Helper
// ==========================================
async function verifyAssignmentBatchAccess(
  userId: string,
  userRole: string,
  batchId: string,
  requireEnrolledStudent = false
) {
  if (userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN) {
    return true;
  }

  const batch = await Batch.findById(batchId);
  if (!batch) return false;

  if (userRole === ROLES.TEACHER) {
    if (!requireEnrolledStudent) {
      if (batch.assignedTeachers && batch.assignedTeachers.length > 0) {
        return batch.assignedTeachers.some((id) => id.toString() === userId.toString());
      }

      // When no teacher is assigned directly to the batch, only the parent
      // course instructors may manage its assignments. Never grant access to
      // every teacher as a fallback.
      const course = await Course.findById(batch.courseId).select('instructors').lean();
      return (course?.instructors || []).some((id: mongoose.Types.ObjectId) => id.toString() === userId.toString());
    }
    return false;
  }

  if (userRole === ROLES.STUDENT) {
    const enrollment = await Enrollment.findOne({
      batchId,
      studentId: userId,
      status: { $in: ['enrolled', 'completed'] },
    });
    return !!enrollment;
  }

  return false;
}

// ==========================================
// 1. Create Assignment (Teacher / Admin)
// ==========================================
export const createAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const data = createAssignmentSchema.parse(req.body);
    const hasAccess = await verifyAssignmentBatchAccess(user._id.toString(), user.role, data.batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You do not have permission to manage assignments in this batch' });
    }

    const assignment = await Assignment.create({
      batchId: new mongoose.Types.ObjectId(data.batchId),
      title: data.title,
      description: data.description,
      totalMarks: data.totalMarks,
      passMarks: data.passMarks,
      dueDate: new Date(data.dueDate),
      allowLateSubmission: data.allowLateSubmission,
      latePenaltyPercent: data.latePenaltyPercent,
      attachmentUrl: data.attachmentUrl,
      isPublished: data.isPublished,
      createdBy: new mongoose.Types.ObjectId(user._id),
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    });
  } catch (error: any) {
    console.error('createAssignment error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create assignment' });
  }
};

// ==========================================
// 2. Get Assignments for a Batch
// ==========================================
export const getBatchAssignments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { batchId } = req.params;
    if (!batchId) return res.status(400).json({ success: false, message: 'Batch ID is required' });

    const hasAccess = await verifyAssignmentBatchAccess(user._id.toString(), user.role, batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You do not have access to this batch' });
    }

    const filter: any = { batchId: new mongoose.Types.ObjectId(batchId) };
    if (user.role === ROLES.STUDENT) {
      filter.isPublished = true;
    }

    const assignments = await Assignment.find(filter)
      .populate('createdBy', 'name email avatarUrl role')
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    // If student, attach their personal submission status
    if (user.role === ROLES.STUDENT) {
      const assignmentIds = assignments.map((a) => a._id);
      const studentSubmissions = await AssignmentSubmission.find({
        assignmentId: { $in: assignmentIds },
        studentId: new mongoose.Types.ObjectId(user._id),
      }).lean();

      const subMap = new Map();
      studentSubmissions.forEach((s) => subMap.set(s.assignmentId.toString(), s));

      const enriched = assignments.map((a) => ({
        ...a,
        mySubmission: subMap.get(a._id.toString()) || null,
      }));

      return res.json({ success: true, count: enriched.length, data: enriched });
    }

    // For Teacher / Admin: attach submission counts
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds },
    }).lean();

    const countsMap = new Map<string, { total: number; evaluated: number }>();
    submissions.forEach((s) => {
      const k = s.assignmentId.toString();
      const current = countsMap.get(k) || { total: 0, evaluated: 0 };
      current.total += 1;
      if (s.isEvaluated) current.evaluated += 1;
      countsMap.set(k, current);
    });

    const enriched = assignments.map((a) => ({
      ...a,
      submissionStats: countsMap.get(a._id.toString()) || { total: 0, evaluated: 0 },
    }));

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    console.error('getBatchAssignments error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch assignments' });
  }
};

// ==========================================
// 3. Get Single Assignment Details
// ==========================================
export const getAssignmentDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId)
      .populate('createdBy', 'name email avatarUrl role')
      .lean();

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const hasAccess = await verifyAssignmentBatchAccess(
      user._id.toString(),
      user.role,
      assignment.batchId.toString()
    );
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let mySubmission = null;
    if (user.role === ROLES.STUDENT) {
      mySubmission = await AssignmentSubmission.findOne({
        assignmentId: assignment._id,
        studentId: user._id,
      }).lean();
    }

    return res.json({
      success: true,
      data: {
        ...assignment,
        mySubmission,
      },
    });
  } catch (error: any) {
    console.error('getAssignmentDetails error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch assignment details' });
  }
};

// ==========================================
// 4. Update Assignment (Teacher / Admin)
// ==========================================
export const updateAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const hasAccess = await verifyAssignmentBatchAccess(
      user._id.toString(),
      user.role,
      assignment.batchId.toString()
    );
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const data = updateAssignmentSchema.parse(req.body);
    if (data.title) assignment.title = data.title;
    if (data.description !== undefined) assignment.description = data.description;
    if (data.totalMarks !== undefined) assignment.totalMarks = data.totalMarks;
    if (data.passMarks !== undefined) assignment.passMarks = data.passMarks;
    if (data.dueDate) assignment.dueDate = new Date(data.dueDate);
    if (data.allowLateSubmission !== undefined) assignment.allowLateSubmission = data.allowLateSubmission;
    if (data.latePenaltyPercent !== undefined) assignment.latePenaltyPercent = data.latePenaltyPercent;
    if (data.attachmentUrl !== undefined) assignment.attachmentUrl = data.attachmentUrl;
    if (data.isPublished !== undefined) assignment.isPublished = data.isPublished;

    await assignment.save();
    return res.json({ success: true, message: 'Assignment updated successfully', data: assignment });
  } catch (error: any) {
    console.error('updateAssignment error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to update assignment' });
  }
};

// ==========================================
// 5. Delete Assignment (Teacher / Admin)
// ==========================================
export const deleteAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const hasAccess = await verifyAssignmentBatchAccess(
      user._id.toString(),
      user.role,
      assignment.batchId.toString()
    );
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await AssignmentSubmission.deleteMany({ assignmentId: assignment._id });
    await assignment.deleteOne();

    return res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('deleteAssignment error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete assignment' });
  }
};

// ==========================================
// 6. Submit Assignment (Student Only)
// ==========================================
export const submitAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students can submit assignments' });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (!assignment.isPublished) {
      return res.status(400).json({ success: false, message: 'This assignment is not currently open' });
    }

    // Security: Student MUST be enrolled in this batch
    const isEnrolled = await verifyAssignmentBatchAccess(
      user._id.toString(),
      user.role,
      assignment.batchId.toString(),
      true
    );
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Only enrolled students in this batch are permitted to submit',
      });
    }

    const now = new Date();
    const isOverdue = now.getTime() > new Date(assignment.dueDate).getTime();

    // Check if late submission is prohibited
    if (isOverdue && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Submission deadline has passed. Late submissions are not permitted for this assignment.',
      });
    }

    const data = submitAssignmentSchema.parse(req.body);
    if (!data.submissionText?.trim() && !data.fileUrl?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide submission text notes or upload a file document',
      });
    }

    // Check existing submission
    let submission = await AssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: user._id,
    });

    if (submission && submission.isEvaluated) {
      return res.status(400).json({
        success: false,
        message: 'This assignment has already been evaluated and finalized by the teacher.',
      });
    }

    if (!submission) {
      submission = new AssignmentSubmission({
        assignmentId: assignment._id,
        batchId: assignment.batchId,
        studentId: user._id,
        submissionText: data.submissionText,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        submittedAt: now,
        isLate: isOverdue,
        status: 'submitted',
      });
    } else {
      submission.submissionText = data.submissionText || submission.submissionText;
      submission.fileUrl = data.fileUrl || submission.fileUrl;
      submission.fileName = data.fileName || submission.fileName;
      submission.submittedAt = now;
      submission.isLate = isOverdue;
      submission.status = 'submitted';
    }

    await submission.save();

    return res.status(200).json({
      success: true,
      message: isOverdue
        ? 'Assignment submitted (Marked as Late Submission)'
        : 'Assignment submitted successfully',
      data: submission,
    });
  } catch (error: any) {
    console.error('submitAssignment error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to submit assignment' });
  }
};

// ==========================================
// 7. Get Submissions for Assignment (Teacher / Admin)
// ==========================================
export const getAssignmentSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const hasAccess = await verifyAssignmentBatchAccess(
      user._id.toString(),
      user.role,
      assignment.batchId.toString()
    );
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const submissions = await AssignmentSubmission.find({ assignmentId: assignment._id })
      .populate('studentId', 'name email avatarUrl userId')
      .populate('evaluatedBy', 'name email')
      .sort({ submittedAt: -1 })
      .lean();

    return res.json({
      success: true,
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        totalMarks: assignment.totalMarks,
        passMarks: assignment.passMarks,
        dueDate: assignment.dueDate,
      },
      count: submissions.length,
      data: submissions,
    });
  } catch (error: any) {
    console.error('getAssignmentSubmissions error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch submissions' });
  }
};

// ==========================================
// 8. Grade / Evaluate Submission (Teacher / Admin)
// ==========================================
export const gradeAssignmentSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { submissionId } = req.params;
    const submission = await AssignmentSubmission.findById(submissionId).populate('assignmentId');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission record not found' });
    }

    const assignment = submission.assignmentId as unknown as IAssignment;
    const hasAccess = await verifyAssignmentBatchAccess(
      user._id.toString(),
      user.role,
      submission.batchId.toString()
    );
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const data = gradeAssignmentSchema.parse(req.body);

    if (data.score > assignment.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Score (${data.score}) cannot exceed assignment total marks (${assignment.totalMarks})`,
      });
    }

    submission.score = data.score;
    submission.feedback = data.feedback;
    if (data.annotatedFileUrl) {
      submission.annotatedFileUrl = data.annotatedFileUrl;
      submission.annotatedFileName = data.annotatedFileName || 'evaluated_script.png';
    }
    submission.isEvaluated = true;
    submission.evaluatedBy = new mongoose.Types.ObjectId(user._id);
    submission.evaluatedAt = new Date();
    submission.status = data.status;

    await submission.save();

    return res.json({
      success: true,
      message: 'Assignment graded successfully',
      data: submission,
    });
  } catch (error: any) {
    console.error('gradeAssignmentSubmission error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to evaluate submission' });
  }
};
