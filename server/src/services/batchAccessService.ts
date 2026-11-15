import { IBatch } from '../models/Batch';
import { IEnrollment } from '../models/Enrollment';
import { ICourse } from '../models/Course';

type CourseAccess = Pick<ICourse, 'studentAccessMode' | 'studentAccessMonths'>;

export function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function getStudentAccessExpiresAt(
  batch: Pick<IBatch, 'endDate'>,
  enrollment: Pick<IEnrollment, 'enrolledAt'>,
  course: CourseAccess
): Date | null {
  if (course.studentAccessMode === 'lifetime') return null;
  if (course.studentAccessMonths && course.studentAccessMonths > 0) {
    return addCalendarMonths(new Date(enrollment.enrolledAt), course.studentAccessMonths);
  }
  if (!batch.endDate) return null;
  const expiresAt = new Date(batch.endDate);
  expiresAt.setUTCHours(23, 59, 59, 999);
  return expiresAt;
}

export function hasActiveStudentBatchAccess(
  batch: Pick<IBatch, 'endDate'>,
  enrollment: Pick<IEnrollment, 'enrolledAt'>,
  course: CourseAccess,
  now = new Date()
): boolean {
  const expiresAt = getStudentAccessExpiresAt(batch, enrollment, course);
  return !expiresAt || now <= expiresAt;
}
