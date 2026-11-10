import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Batch } from '../models/Batch';
import { Enrollment } from '../models/Enrollment';
import { Examination, ExamAttempt } from '../models/Examination';
import { Assignment, AssignmentSubmission } from '../models/Assignment';
import { User } from '../models/User';
import { ROLES } from '../types/roles';

/**
 * Get Marksheet for a Batch
 * Security Rules:
 * - Admin / Superadmin / Teacher: Can view all students' marksheet or filter by student.
 * - Student: Can ONLY see their own marksheet record.
 * - Guardian: Can see their linked child's marksheet record.
 */
export const getBatchMarksheet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { batchId } = req.params;
    if (!batchId) return res.status(400).json({ success: false, message: 'Batch ID is required' });

    const batch = await Batch.findById(batchId).populate('courseId', 'title gradeLevel subject').lean();
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const isStaff = user.role === ROLES.ADMIN || user.role === ROLES.SUPERADMIN || user.role === ROLES.TEACHER;

    // Verify user authorization for this batch
    if (user.role === ROLES.TEACHER) {
      if (batch.assignedTeachers && batch.assignedTeachers.length > 0) {
        const isAssigned = batch.assignedTeachers.some((id) => id.toString() === user._id.toString());
        if (!isAssigned) {
          return res.status(403).json({ success: false, message: 'Not authorized for this batch' });
        }
      }
    } else if (user.role === ROLES.STUDENT) {
      const enrollment = await Enrollment.findOne({
        batchId,
        studentId: user._id,
        status: { $in: ['enrolled', 'completed'] },
      });
      if (!enrollment) {
        return res.status(403).json({ success: false, message: 'Not enrolled in this batch' });
      }
    } else if (user.role === ROLES.GUARDIAN) {
      const guardian = await User.findById(user._id);
      const linked = guardian?.guardianDetails?.linkedStudents || [];
      if (linked.length === 0) {
        return res.status(403).json({ success: false, message: 'No linked student found' });
      }
      const hasChildEnrolled = await Enrollment.findOne({
        batchId,
        studentId: { $in: linked },
        status: { $in: ['enrolled', 'completed'] },
      });
      if (!hasChildEnrolled) {
        return res.status(403).json({ success: false, message: 'Child is not enrolled in this batch' });
      }
    }

    // Determine target students
    let targetStudentIds: mongoose.Types.ObjectId[] = [];

    if (isStaff) {
      // Find all enrolled students in the batch
      const enrollments = await Enrollment.find({
        batchId: new mongoose.Types.ObjectId(batchId),
        status: { $in: ['enrolled', 'completed'] },
      }).select('studentId');
      targetStudentIds = enrollments.map((e) => e.studentId as mongoose.Types.ObjectId);
    } else if (user.role === ROLES.STUDENT) {
      // STRICT: student only views self
      targetStudentIds = [new mongoose.Types.ObjectId(user._id)];
    } else if (user.role === ROLES.GUARDIAN) {
      const guardian = await User.findById(user._id);
      const linked = guardian?.guardianDetails?.linkedStudents || [];
      const childEnrollments = await Enrollment.find({
        batchId: new mongoose.Types.ObjectId(batchId),
        studentId: { $in: linked },
        status: { $in: ['enrolled', 'completed'] },
      }).select('studentId');
      targetStudentIds = childEnrollments.map((e) => e.studentId as mongoose.Types.ObjectId);
    }

    // Fetch students info
    const students = await User.find({ _id: { $in: targetStudentIds } })
      .select('name email avatarUrl userId phone')
      .lean();

    // Fetch all Exams in this batch
    const exams = await Examination.find({
      batchId: new mongoose.Types.ObjectId(batchId),
      isPublished: true,
    })
      .select('title totalMarks passMarks durationMinutes startWindow endWindow')
      .sort({ createdAt: 1 })
      .lean();

    // Fetch all Assignments in this batch
    const assignments = await Assignment.find({
      batchId: new mongoose.Types.ObjectId(batchId),
      isPublished: true,
    })
      .select('title totalMarks passMarks dueDate')
      .sort({ createdAt: 1 })
      .lean();

    // Fetch attempts for target students
    const examAttempts = await ExamAttempt.find({
      batchId: new mongoose.Types.ObjectId(batchId),
      studentId: { $in: targetStudentIds },
    })
      .select('examId studentId mcqScore cqScore totalScore passed isEvaluated status submittedAt')
      .lean();

    // Fetch assignment submissions for target students
    const assignmentSubmissions = await AssignmentSubmission.find({
      batchId: new mongoose.Types.ObjectId(batchId),
      studentId: { $in: targetStudentIds },
    })
      .select('assignmentId studentId score feedback annotatedFileUrl annotatedFileName isEvaluated isLate status submittedAt')
      .lean();

    // Build Student Marksheet Matrix
    const studentMarksheets = students.map((st) => {
      const stIdStr = st._id.toString();

      // Exam records
      const studentExams = exams.map((ex) => {
        const attempt = examAttempts.find(
          (att) => att.studentId.toString() === stIdStr && att.examId.toString() === ex._id.toString()
        );
        return {
          examId: ex._id,
          title: ex.title,
          totalMarks: ex.totalMarks,
          passMarks: ex.passMarks,
          attempted: !!attempt,
          status: attempt ? attempt.status : 'unattempted',
          mcqScore: attempt ? attempt.mcqScore : 0,
          cqScore: attempt ? attempt.cqScore : 0,
          obtainedMarks: attempt ? attempt.totalScore : null,
          passed: attempt ? attempt.passed : false,
          isEvaluated: attempt ? attempt.isEvaluated : false,
          submittedAt: attempt ? attempt.submittedAt : null,
        };
      });

      // Assignment records
      const studentAssignments = assignments.map((asgn) => {
        const sub = assignmentSubmissions.find(
          (s) => s.studentId.toString() === stIdStr && s.assignmentId.toString() === asgn._id.toString()
        );
        return {
          assignmentId: asgn._id,
          title: asgn.title,
          totalMarks: asgn.totalMarks,
          passMarks: asgn.passMarks,
          dueDate: asgn.dueDate,
          submitted: !!sub,
          isLate: sub ? sub.isLate : false,
          status: sub ? sub.status : 'unsubmitted',
          obtainedMarks: sub && sub.isEvaluated ? sub.score : null,
          feedback: sub ? sub.feedback : '',
          annotatedFileUrl: sub ? sub.annotatedFileUrl : '',
          annotatedFileName: sub ? sub.annotatedFileName : '',
          isEvaluated: sub ? sub.isEvaluated : false,
          submittedAt: sub ? sub.submittedAt : null,
        };
      });

      // Compute aggregate statistics
      const totalPossibleExamMarks = exams.reduce((acc, curr) => acc + curr.totalMarks, 0);
      const totalObtainedExamMarks = studentExams.reduce((acc, curr) => acc + (curr.obtainedMarks || 0), 0);

      const totalPossibleAssignmentMarks = assignments.reduce((acc, curr) => acc + curr.totalMarks, 0);
      const totalObtainedAssignmentMarks = studentAssignments.reduce(
        (acc, curr) => acc + (curr.obtainedMarks || 0),
        0
      );

      const grandTotalPossible = totalPossibleExamMarks + totalPossibleAssignmentMarks;
      const grandTotalObtained = totalObtainedExamMarks + totalObtainedAssignmentMarks;
      const percentage = grandTotalPossible > 0 ? Math.round((grandTotalObtained / grandTotalPossible) * 100) : 0;

      return {
        student: st,
        exams: studentExams,
        assignments: studentAssignments,
        summary: {
          totalExams: exams.length,
          examsAttempted: studentExams.filter((e) => e.attempted).length,
          examsPassed: studentExams.filter((e) => e.passed).length,
          totalAssignments: assignments.length,
          assignmentsSubmitted: studentAssignments.filter((a) => a.submitted).length,
          totalPossibleExamMarks,
          totalObtainedExamMarks,
          totalPossibleAssignmentMarks,
          totalObtainedAssignmentMarks,
          grandTotalPossible,
          grandTotalObtained,
          percentage,
        },
      };
    });

    return res.json({
      success: true,
      batch: {
        _id: batch._id,
        name: batch.name,
        course: batch.courseId,
      },
      isStaff,
      counts: {
        totalStudents: students.length,
        totalExams: exams.length,
        totalAssignments: assignments.length,
      },
      examsMetadata: exams,
      assignmentsMetadata: assignments,
      data: studentMarksheets,
    });
  } catch (error: any) {
    console.error('getBatchMarksheet error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch marksheet' });
  }
};
