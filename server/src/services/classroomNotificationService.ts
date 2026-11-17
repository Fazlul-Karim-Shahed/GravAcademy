import { Assignment, AssignmentSubmission } from '../models/Assignment';
import { AssignmentReminder } from '../models/AssignmentReminder';
import { Examination } from '../models/Examination';
import { ExamReminder } from '../models/ExamReminder';
import { Enrollment } from '../models/Enrollment';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { sendClassroomEventEmail } from './emailService';

const appUrl = (process.env.PUBLIC_APP_URL || 'https://grav-academy.vercel.app').replace(/\/+$/, '');
const formatDate = (date: Date) => new Intl.DateTimeFormat('bn-BD', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka',
}).format(new Date(date));

let classroomEmailQueue: Promise<unknown> = Promise.resolve();

export const notifyEmail = (email: string | undefined, subject: string, body: string) => {
  if (!email) return;
  classroomEmailQueue = classroomEmailQueue.catch(() => undefined)
    .then(() => sendClassroomEventEmail(email, subject, body))
    .catch((error) => console.warn('[Classroom notification]', error));
};

export const dispatchNotification = (work: Promise<unknown>) => {
  void work.catch((error) => console.warn('[Classroom notification]', error));
};

export const notifyStudent = async (gravId: string, subject: string, body: string) => {
  const student = await User.findOne({ gravId, role: 'student' }).select('email').lean();
  notifyEmail(student?.email, subject, body);
};

export const notifyBatchStudents = async (batchId: string, subject: string, body: string) => {
  const enrollments = await Enrollment.find({ batchId, status: { $in: ['enrolled', 'completed'] } })
    .select('gravId').lean();
  const gravIds = [...new Set(enrollments.map((entry) => entry.gravId))];
  const students = await User.find({ gravId: { $in: gravIds }, role: 'student' }).select('email').lean();
  for (const student of students) notifyEmail(student.email, subject, body);
};

export const notifyBatchTeachers = async (batchId: string, subject: string, body: string) => {
  const batch = await Batch.findById(batchId).select('assignedTeachers courseId').lean();
  if (!batch) return;
  const course = await Course.findById(batch.courseId).select('instructors').lean();
  const ids = [...new Set([...(batch.assignedTeachers || []), ...(course?.instructors || [])].map((id) => id.toString()))];
  const teachers = await User.find({ _id: { $in: ids }, role: 'teacher' }).select('email').lean();
  for (const teacher of teachers) notifyEmail(teacher.email, subject, body);
};

export const notifyAssignmentPublished = (assignment: { batchId: { toString(): string }; _id: { toString(): string }; title: string; dueDate: Date }) =>
  notifyBatchStudents(assignment.batchId.toString(), `নতুন অ্যাসাইনমেন্ট: ${assignment.title}`,
    `নতুন অ্যাসাইনমেন্ট প্রকাশ হয়েছে: ${assignment.title}\nজমার শেষ সময়: ${formatDate(assignment.dueDate)}\n${appUrl}/classroom/${assignment.batchId}/assignments/${assignment._id}`);

export const notifyExamPublished = (exam: { batchId: { toString(): string }; _id: { toString(): string }; title: string; startWindow: Date; endWindow: Date }) =>
  notifyBatchStudents(exam.batchId.toString(), `নতুন পরীক্ষা: ${exam.title}`,
    `নতুন পরীক্ষা প্রকাশ হয়েছে: ${exam.title}\nশুরু: ${formatDate(exam.startWindow)}\nশেষ: ${formatDate(exam.endWindow)}\n${appUrl}/classroom/${exam.batchId}/exams`);

export const runAssignmentReminders = async () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const assignments = await Assignment.find({ isPublished: true, dueDate: { $gt: now, $lte: tomorrow } })
    .select('_id batchId title dueDate').lean();
  for (const assignment of assignments) {
    const enrollments = await Enrollment.find({ batchId: assignment.batchId, status: { $in: ['enrolled', 'completed'] } })
      .select('gravId').lean();
    const submitted = await AssignmentSubmission.distinct('gravId', { assignmentId: assignment._id });
    const submittedSet = new Set(submitted);
    for (const gravId of new Set(enrollments.map((entry) => entry.gravId))) {
      if (submittedSet.has(gravId)) continue;
      const student = await User.findOne({ gravId, role: 'student' }).select('email').lean();
      if (!student?.email) continue;
      try {
        await AssignmentReminder.create({ assignmentId: assignment._id, gravId, dueDate: assignment.dueDate });
      } catch (error: any) {
        if (error?.code === 11000) continue;
        throw error;
      }
      const sent = await sendClassroomEventEmail(student.email, `অ্যাসাইনমেন্ট জমার সময় শেষ হচ্ছে: ${assignment.title}`,
        `আপনি এখনো "${assignment.title}" অ্যাসাইনমেন্ট জমা দেননি।\nশেষ সময়: ${formatDate(assignment.dueDate)}\n${appUrl}/classroom/${assignment.batchId}/assignments/${assignment._id}`);
      if (!sent) await AssignmentReminder.deleteOne({ assignmentId: assignment._id, gravId, dueDate: assignment.dueDate });
    }
  }
};

export const runExamReminders = async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000);
  const exams = await Examination.find({ isPublished: true, startWindow: { $gt: now, $lte: soon } })
    .select('_id batchId title startWindow').lean();
  for (const exam of exams) {
    const enrollments = await Enrollment.find({ batchId: exam.batchId, status: { $in: ['enrolled', 'completed'] } })
      .select('gravId').lean();
    for (const gravId of new Set(enrollments.map((entry) => entry.gravId))) {
      const student = await User.findOne({ gravId, role: 'student' }).select('email').lean();
      if (!student?.email) continue;
      try {
        await ExamReminder.create({ examId: exam._id, gravId, startWindow: exam.startWindow });
      } catch (error: any) {
        if (error?.code === 11000) continue;
        throw error;
      }
      const sent = await sendClassroomEventEmail(student.email, `পরীক্ষা শুরু হবে: ${exam.title}`,
        `"${exam.title}" পরীক্ষা শুরু হবে ${formatDate(exam.startWindow)}।\n${classroomLink(exam.batchId.toString(), '/exams')}`);
      if (!sent) await ExamReminder.deleteOne({ examId: exam._id, gravId, startWindow: exam.startWindow });
    }
  }
};

export const classroomLink = (batchId: string, suffix = '') => `${appUrl}/classroom/${batchId}${suffix}`;
export { formatDate };
