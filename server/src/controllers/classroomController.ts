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
async function verifyClassroomAccess(gravId: string, userRole: string, batchId: string) {
  // Admin & Superadmin have unrestricted access everywhere
  if (userRole === 'admin' || userRole === 'superadmin') {
    return true;
  }

  const batch = await Batch.findById(batchId);
  if (!batch) return false;

  // Teachers may only access batches assigned directly to them, or the parent
  // course when no batch-level assignment has been configured.
  if (userRole === 'teacher') {
    if (batch.assignedTeachers && batch.assignedTeachers.length > 0) {
      return batch.assignedTeachers.some((tId) => tId.toString() === gravId.toString());
    }
    const course = await Course.findById(batch.courseId).select('instructors').lean();
    return (course?.instructors || []).some((tId: mongoose.Types.ObjectId) => tId.toString() === gravId.toString());
  }

  if (userRole === 'student') {
    const enrollment = await Enrollment.findOne({
      batchId,
      gravId: gravId,
      status: { $in: ['enrolled', 'completed'] },
    });
    return !!enrollment;
  }

  if (userRole === 'guardian') {
    const guardian = await User.findOne({ gravId });
    const gravIds = guardian?.guardianDetails?.linkedGravIds || [];
    if (gravIds.length === 0) return false;

    const enrollment = await Enrollment.findOne({
      batchId,
      gravId: { $in: gravIds },
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

    const gravId = req.user?.role === 'student' ? req.user.gravId : req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(gravId, userRole, batchId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'à¦†à¦ªà¦¨à¦¿ à¦à¦‡ à¦•à§à¦²à¦¾à¦¸à¦°à§à¦®à§‡à¦° à¦¸à¦¦à¦¸à§à¦¯ à¦¨à¦¨ à¦¬à¦¾ à¦†à¦ªà¦¨à¦¾à¦° à¦…à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤ à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸ à¦¨à§‡à¦‡à¥¤',
      });
    }

    const batch = await Batch.findById(batchId)
      .populate({
        path: 'courseId',
        select: 'title slug gradeLevel subject instructors',
        populate: {
          path: 'instructors',
          select: 'name email role gravId avatarUrl',
        },
      })
      .populate('assignedTeachers', 'name email role gravId avatarUrl');

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

    const canViewAllMembers = ['admin', 'superadmin', 'teacher'].includes(userRole);

    const studentCount = canViewAllMembers
      ? await Enrollment.countDocuments({
          batchId,
          status: { $in: ['enrolled', 'completed'] },
        })
      : 0;

    const announcementCount = await Announcement.countDocuments({ batchId });

    return res.status(200).json({
      success: true,
      data: {
        batch,
        memberCounts: {
          teachersCount: combinedTeachers.length,
          studentsCount: studentCount,
          totalMembers: canViewAllMembers ? combinedTeachers.length + studentCount : combinedTeachers.length,
        },
        canViewStudentMembers: canViewAllMembers,
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
    const gravId = req.user?.role === 'student' ? req.user.gravId : req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(gravId, userRole, batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const batch = await Batch.findById(batchId)
      .populate('assignedTeachers', 'name gravId role avatarUrl email')
      .populate({
        path: 'courseId',
        select: 'instructors',
        populate: {
          path: 'instructors',
          select: 'name gravId role avatarUrl email',
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

    const canViewAllMembers = ['admin', 'superadmin', 'teacher'].includes(userRole);

    let students: any[] = [];
    if (canViewAllMembers) {
      const enrollments = await Enrollment.find({
        batchId,
        status: { $in: ['enrolled', 'completed'] },
      }).sort({ createdAt: -1 });

      const enrolledGravIds = enrollments.map((e) => e.gravId).filter(Boolean);
      students = await User.find({ gravId: { $in: enrolledGravIds }, role: 'student' })
        .select('name email phone avatarUrl gravId role createdAt')
        .lean();
    }

    return res.status(200).json({
      success: true,
      data: {
        teachers: combinedTeachers,
        students: canViewAllMembers ? students : [],
        totalCount: combinedTeachers.length + (canViewAllMembers ? students.length : 0),
        canViewStudentMembers: canViewAllMembers,
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
    const gravId = req.user?.role === 'student' ? req.user.gravId : req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(gravId, userRole, batchId);
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

    const gravId = req.user?.role === 'student' ? req.user.gravId : req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(gravId, userRole, batchId);
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

    const author = req.user;

    const announcement = await Announcement.create({
      batchId,
      authorId: req.user!._id,
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
    }).lean();
    const studentUsers = await User.find({ gravId: { $in: enrollments.map((e) => e.gravId) } })
      .select('email')
      .lean();
    const studentEmails = studentUsers
      .map((student) => student.email)
      .filter(Boolean);

    // Merge unique emails excluding the author
    const recipientEmails = Array.from(new Set([...teacherEmails, ...studentEmails])).filter(
      (email) => email !== author?.email
    );

    // Send email notifications asynchronously
    sendClassroomEmailNotification({
      toEmails: recipientEmails,
      batchName: batch.name,
      announcerName: `${author?.name} (${userRole === 'teacher' ? 'à¦¶à¦¿à¦•à§à¦·à¦•' : userRole === 'admin' ? 'à¦à¦¡à¦®à¦¿à¦¨' : 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€'})`,
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
    const gravId = req.user?.role === 'student' ? req.user.gravId : req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(gravId, userRole, batchId);
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

    const gravId = req.user?.role === 'student' ? req.user.gravId : req.user?._id?.toString() || '';
    const userRole = req.user?.role || 'student';

    const hasAccess = await verifyClassroomAccess(gravId, userRole, batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const sender = req.user;

    const newMsg = await DiscussionMessage.create({
      batchId,
      senderId: req.user!._id,
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
