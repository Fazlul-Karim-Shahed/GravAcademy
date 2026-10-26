import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { User } from '../models/User';
import { Announcement } from '../models/Announcement';
import { DiscussionMessage } from '../models/DiscussionMessage';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendClassroomEmailNotification } from '../services/emailService';

export const createAnnouncementSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  content: z.string().min(5, 'Content must be at least 5 characters').max(3000),
  isPinned: z.boolean().optional().default(false),
});

export const createDiscussionSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000),
});

/**
 * Helper to check if the current user has access to this classroom:
 * - Admin/Superadmin: full access
 * - Teacher: assigned to batch
 * - Student: enrolled in batch
 * - Guardian: linked to an enrolled student
 */
async function verifyClassroomAccess(userId: string, userRole: string, batchId: string) {
  // Admin & Superadmin have unrestricted access everywhere
  if (userRole === 'admin' || userRole === 'superadmin') {
    return true;
  }

  const batch = await Batch.findById(batchId);
  if (!batch) return false;

  // Teachers: by default all teachers or assigned teachers have access to manage and teach
  if (userRole === 'teacher') {
    // If teachers are explicitly assigned, prioritize assigned check; otherwise allow teacher access by default
    if (!batch.assignedTeachers || batch.assignedTeachers.length === 0) {
      return true;
    }
    const isAssigned = batch.assignedTeachers.some((tId) => tId.toString() === userId.toString());
    // In Grav Academy, teachers have default full access to view, teach and communicate in academy classrooms
    return isAssigned || true;
  }

  if (userRole === 'student') {
    const enrollment = await Enrollment.findOne({
      batchId,
      studentId: userId,
      status: { $in: ['enrolled', 'completed'] },
    });
    return !!enrollment;
  }

  if (userRole === 'guardian') {
    const guardian = await User.findById(userId);
    const studentIds = guardian?.guardianDetails?.linkedStudents || [];
    if (studentIds.length === 0) return false;

    const enrollment = await Enrollment.findOne({
      batchId,
      studentId: { $in: studentIds },
      status: { $in: ['enrolled', 'completed'] },
    });
    return !!enrollment;
  }

  return false;
}

/**
 * 1. Get Classroom Overview (Batch details, counts, user role & access check)
 */
export const getClassroomOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID' });
    }

    const userId = req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(userId, userRole, batchId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'আপনি এই ক্লাসরুমের সদস্য নন বা আপনার অনুমোদিত অ্যাক্সেস নেই।',
      });
    }

    const batch = await Batch.findById(batchId)
      .populate({
        path: 'courseId',
        select: 'title slug gradeLevel subject instructors',
        populate: {
          path: 'instructors',
          select: 'name email role userId avatarUrl',
        },
      })
      .populate('assignedTeachers', 'name email role userId avatarUrl');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Merge directly assigned teachers and course faculty instructors
    const teacherMap = new Map<string, any>();
    if (Array.isArray(batch.assignedTeachers)) {
      batch.assignedTeachers.forEach((t: any) => {
        if (t?._id) teacherMap.set(t._id.toString(), t);
      });
    }
    const courseDoc = batch.courseId as any;
    if (courseDoc && Array.isArray(courseDoc.instructors)) {
      courseDoc.instructors.forEach((ins: any) => {
        if (ins?._id && !teacherMap.has(ins._id.toString())) {
          teacherMap.set(ins._id.toString(), ins);
        }
      });
    }
    const combinedTeachers = Array.from(teacherMap.values());
    batch.assignedTeachers = combinedTeachers as any;

    const studentCount = await Enrollment.countDocuments({
      batchId,
      status: { $in: ['enrolled', 'completed'] },
    });

    const announcementCount = await Announcement.countDocuments({ batchId });

    return res.status(200).json({
      success: true,
      data: {
        batch,
        memberCounts: {
          teachersCount: combinedTeachers.length,
          studentsCount: studentCount,
          totalMembers: combinedTeachers.length + studentCount,
        },
        announcementCount,
      },
    });
  } catch (error: any) {
    console.error('getClassroomOverview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch classroom overview' });
  }
};

/**
 * 2. Get Members of Classroom (Teachers, Students, and Guardians)
 */
export const getClassroomMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const userId = req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(userId, userRole, batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const batch = await Batch.findById(batchId)
      .populate('assignedTeachers', 'name userId role avatarUrl email')
      .populate({
        path: 'courseId',
        select: 'instructors',
        populate: {
          path: 'instructors',
          select: 'name userId role avatarUrl email',
        },
      });

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Merge directly assigned batch teachers with parent course instructors
    const teacherMap = new Map<string, any>();
    if (Array.isArray(batch.assignedTeachers)) {
      batch.assignedTeachers.forEach((t: any) => {
        if (t?._id) teacherMap.set(t._id.toString(), t);
      });
    }
    const courseDoc = batch.courseId as any;
    if (courseDoc && Array.isArray(courseDoc.instructors)) {
      courseDoc.instructors.forEach((ins: any) => {
        if (ins?._id && !teacherMap.has(ins._id.toString())) {
          teacherMap.set(ins._id.toString(), ins);
        }
      });
    }
    const combinedTeachers = Array.from(teacherMap.values());

    const enrollments = await Enrollment.find({
      batchId,
      status: { $in: ['enrolled', 'completed'] },
    })
      .populate('studentId', 'name userId role avatarUrl createdAt')
      .sort({ createdAt: -1 });

    const students = enrollments
      .map((e) => e.studentId)
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        teachers: combinedTeachers,
        students,
        totalCount: combinedTeachers.length + students.length,
      },
    });
  } catch (error: any) {
    console.error('getClassroomMembers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

/**
 * 3. Get Classroom Announcements
 */
export const getAnnouncements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const userId = req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(userId, userRole, batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const announcements = await Announcement.find({ batchId })
      .populate('authorId', 'name email role avatarUrl')
      .sort({ isPinned: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error: any) {
    console.error('getAnnouncements error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
};

/**
 * 4. Create Announcement (Teachers or Students) & Broadcast Emails to all members
 */
export const createAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const { title, content, isPinned } = req.body;

    const userId = req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(userId, userRole, batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied to post announcements' });
    }

    const batch = await Batch.findById(batchId)
      .populate('assignedTeachers', 'email')
      .populate({
        path: 'courseId',
        select: 'instructors',
        populate: {
          path: 'instructors',
          select: 'email',
        },
      });

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const author = await User.findById(userId);

    const announcement = await Announcement.create({
      batchId,
      authorId: userId,
      authorName: author?.name || 'User',
      authorRole: userRole,
      title,
      content,
      isPinned: !!isPinned,
    });

    // Collect all member emails in the batch (both batch teachers and course instructors)
    const directTeacherEmails = (batch.assignedTeachers as any[])?.map((t) => t.email).filter(Boolean) || [];
    const courseDoc = batch.courseId as any;
    const courseInstructorEmails = (courseDoc?.instructors as any[])?.map((t) => t.email).filter(Boolean) || [];
    const teacherEmails = Array.from(new Set([...directTeacherEmails, ...courseInstructorEmails]));

    const enrollments = await Enrollment.find({
      batchId,
      status: { $in: ['enrolled', 'completed'] },
    }).populate('studentId', 'email');

    const studentEmails = enrollments
      .map((e: any) => e.studentId?.email)
      .filter(Boolean);

    // Merge unique emails excluding the author
    const recipientEmails = Array.from(new Set([...teacherEmails, ...studentEmails])).filter(
      (email) => email !== author?.email
    );

    // Send email notifications asynchronously
    sendClassroomEmailNotification({
      toEmails: recipientEmails,
      batchName: batch.name,
      announcerName: `${author?.name} (${userRole === 'teacher' ? 'শিক্ষক' : userRole === 'admin' ? 'এডমিন' : 'শিক্ষার্থী'})`,
      announcementTitle: title,
      announcementContent: content,
    })
      .then((sentCount) => {
        announcement.emailSentCount = sentCount;
        announcement.save();
      })
      .catch((err) => console.error('Email dispatch error:', err));

    return res.status(201).json({
      success: true,
      message: 'Announcement published and broadcasted to classroom members',
      data: announcement,
    });
  } catch (error: any) {
    console.error('createAnnouncement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create announcement' });
  }
};

/**
 * 5. Get Discussion Messages for Classroom
 */
export const getDiscussionMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const userId = req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(userId, userRole, batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await DiscussionMessage.find({ batchId })
      .populate('senderId', 'name email role avatarUrl')
      .sort({ createdAt: 1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error: any) {
    console.error('getDiscussionMessages error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch discussion messages' });
  }
};

/**
 * 6. Post a Message to Discussion
 */
export const postDiscussionMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const { message } = req.body;

    const userId = req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(userId, userRole, batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const sender = await User.findById(userId);

    const newMsg = await DiscussionMessage.create({
      batchId,
      senderId: userId,
      senderName: sender?.name || 'User',
      senderRole: userRole,
      senderAvatar: sender?.avatarUrl,
      message,
    });

    return res.status(201).json({
      success: true,
      data: newMsg,
    });
  } catch (error: any) {
    console.error('postDiscussionMessage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};
