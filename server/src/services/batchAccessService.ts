import { IBatch } from '../models/Batch';
import { IEnrollment } from '../models/Enrollment';

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
  batch: Pick<IBatch, 'studentAccessMode' | 'studentAccessMonths' | 'endDate'>,
  enrollment: Pick<IEnrollment, 'enrolledAt'>
): Date | null {
  if (batch.studentAccessMode === 'lifetime') return null;
  if (batch.studentAccessMonths && batch.studentAccessMonths > 0) {
    return addCalendarMonths(new Date(enrollment.enrolledAt), batch.studentAccessMonths);
  }
  if (!batch.endDate) return null;
  const expiresAt = new Date(batch.endDate);
  expiresAt.setUTCHours(23, 59, 59, 999);
  return expiresAt;
}

export function hasActiveStudentBatchAccess(
  batch: Pick<IBatch, 'studentAccessMode' | 'studentAccessMonths' | 'endDate'>,
  enrollment: Pick<IEnrollment, 'enrolledAt'>,
  now = new Date()
): boolean {
  const expiresAt = getStudentAccessExpiresAt(batch, enrollment);
  return !expiresAt || now <= expiresAt;
}
