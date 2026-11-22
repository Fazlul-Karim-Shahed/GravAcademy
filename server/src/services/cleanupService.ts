import { AuditLog } from '../models/AuditLog';
import { EnrollmentRequest } from '../models/EnrollmentRequest';
import { AssignmentReminder } from '../models/AssignmentReminder';
import { ExamReminder } from '../models/ExamReminder';
import { DiscussionMessage } from '../models/DiscussionMessage';
import { Setting } from '../models/Setting';

export interface CleanupResult { auditLogs: number; staleRequests: number; assignmentReminders: number; examReminders: number; loadTestMessages: number; }

export async function runDatabaseCleanup(): Promise<CleanupResult> {
  const now = Date.now();
  const auditBefore = new Date(now - 180 * 24 * 60 * 60 * 1000);
  const requestBefore = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const reminderBefore = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const loadTestBefore = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const [auditLogs, staleRequests, assignmentReminders, examReminders, loadTestMessages] = await Promise.all([
    AuditLog.deleteMany({ createdAt: { $lt: auditBefore } }),
    EnrollmentRequest.deleteMany({ status: { $in: ['verification_pending', 'email_failed'] }, createdAt: { $lt: requestBefore } }),
    AssignmentReminder.deleteMany({ dueDate: { $lt: reminderBefore } }),
    ExamReminder.deleteMany({ startWindow: { $lt: reminderBefore } }),
    DiscussionMessage.deleteMany({ content: /^\[LOAD TEST\]/i, createdAt: { $lt: loadTestBefore } }),
  ]);
  const result = { auditLogs: auditLogs.deletedCount, staleRequests: staleRequests.deletedCount, assignmentReminders: assignmentReminders.deletedCount, examReminders: examReminders.deletedCount, loadTestMessages: loadTestMessages.deletedCount };
  await Setting.findOneAndUpdate({ key: 'databaseCleanupLastRun' }, { key: 'databaseCleanupLastRun', value: { at: new Date().toISOString(), result } }, { upsert: true });
  return result;
}

export function startDatabaseCleanup(): void {
  let running = false;
  const check = async () => {
    if (running) return;
    const now = new Date();
    if (now.getDay() !== 0 || now.getHours() !== 3) return;
    const last = await Setting.findOne({ key: 'databaseCleanupLastRun' }).lean();
    const lastAt = last?.value?.at ? new Date(last.value.at).getTime() : 0;
    if (Date.now() - lastAt < 6 * 24 * 60 * 60 * 1000) return;
    running = true;
    try { console.log('[Cleanup]', await runDatabaseCleanup()); } catch (error) { console.error('[Cleanup] failed', error); } finally { running = false; }
  };
  setInterval(() => void check(), 60 * 60 * 1000);
  void check();
}
