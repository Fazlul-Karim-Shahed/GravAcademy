'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatBDDate } from '@/lib/dateUtils';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  RefreshCw,
  ClipboardCheck,
  Check,
  X,
  UserCheck,
  History,
  Sparkles,
} from 'lucide-react';

interface AttendanceRecordItem {
  studentId: string;
  gravId: string;
  studentName: string;
  avatarUrl?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note: string;
}

interface SessionSummary {
  _id: string;
  date: string;
  topic?: string;
  takenByName: string;
  takenByRole: string;
  total: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
}

interface ClassroomAttendanceTabProps {
  batchId: string;
  user: any;
  assignedTeachers?: { _id: string }[];
}

export const ClassroomAttendanceTab: React.FC<ClassroomAttendanceTabProps> = ({
  batchId,
  user,
  assignedTeachers = [],
}) => {
  const isTeacher = user?.role === 'teacher';
  const isAdmin = ['superadmin', 'admin'].includes(user?.role || '');
  const isAssignedTeacher = isTeacher && assignedTeachers.some((t) => t._id === user?.id || t._id === user?._id);
  const canManage = isAdmin || isAssignedTeacher;

  // Management State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Student / Guardian State
  const [studentStats, setStudentStats] = useState<{
    ward?: { name: string; gravId: string };
    totalClasses: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    excusedCount: number;
    attendanceRate: number;
    history: Array<{ date: string; topic?: string; status: string; note?: string }>;
  } | null>(null);

  useEffect(() => {
    loadAttendanceData();
  }, [batchId, selectedDate]);

  const loadAttendanceData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get(`/classrooms/${batchId}/attendance`, {
        params: { date: selectedDate },
      });

      if (res.data?.success) {
        if (res.data.canManage) {
          const { enrolledStudents, sessions: sessList, currentSheet } = res.data.data;
          setSessions(sessList || []);

          if (currentSheet && Array.isArray(currentSheet.records)) {
            // Pre-populate with saved sheet
            setTopic(currentSheet.topic || '');
            const sheetMap = new Map<string, any>();
            currentSheet.records.forEach((r: any) => sheetMap.set(r.gravId, r));

            const merged = enrolledStudents.map((st: any) => {
              const saved = sheetMap.get(st.gravId);
              return {
                studentId: st.studentId || st._id,
                gravId: st.gravId,
                studentName: st.name,
                avatarUrl: st.avatarUrl,
                status: saved ? saved.status : 'present',
                note: saved ? saved.note || '' : '',
              };
            });
            setRecords(merged);
          } else {
            // Fresh sheet for today/selected date: default everyone to 'present'
            setTopic('');
            const initial = enrolledStudents.map((st: any) => ({
              studentId: st.studentId || st._id,
              gravId: st.gravId,
              studentName: st.name,
              avatarUrl: st.avatarUrl,
              status: 'present' as const,
              note: '',
            }));
            setRecords(initial);
          }
        } else {
          // Student or Guardian view
          setStudentStats(res.data.data);
        }
      }
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'হাজিরা তথ্য লোড করতে ব্যর্থ' });
    } finally {
      setLoading(false);
    }
  };

  const setAllStatus = (status: 'present' | 'absent') => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const updateStudentStatus = (gravId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setRecords((prev) =>
      prev.map((r) => (r.gravId === gravId ? { ...r, status } : r))
    );
  };

  const updateStudentNote = (gravId: string, note: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.gravId === gravId ? { ...r, note } : r))
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedDate) {
      setMessage({ type: 'error', text: 'অনুগ্রহ করে তারিখ নির্বাচন করুন' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post(`/classrooms/${batchId}/attendance`, {
        date: selectedDate,
        topic,
        records: records.map((r) => ({
          studentId: r.studentId,
          gravId: r.gravId,
          studentName: r.studentName,
          status: r.status,
          note: r.note,
        })),
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: res.data.message || 'হাজিরা সফলভাবে সংরক্ষিত হয়েছে' });
        // Refresh session list
        void loadAttendanceData();
      }
    } catch (err: any) {
      console.error('Save attendance error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'হাজিরা সংরক্ষণ করা যায়নি' });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const excusedCount = records.filter((r) => r.status === 'excused').length;
  const totalStudents = records.length;
  const currentRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

  // =========================================================================
  // RENDER: TEACHER / ADMIN VIEW (MANAGEMENT)
  // =========================================================================
  if (canManage) {
    return (
      <div className="space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#262b34] pb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              শিক্ষার্থী উপস্থিতি (Attendance Sheet)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              তারিখ নির্বাচন করে শিক্ষার্থীদের হাজিরা গ্রহণ ও হালনাগাদ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#111318] text-xs font-bold text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-orange-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent focus:outline-hidden font-mono"
              />
            </label>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
        )}

        {/* Attendance Meta & Summary Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ক্লাসের বিষয় / টপিক (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="যেমন: লেকচার ৩: ত্রিকোণমিতি সূত্রাবলী"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllStatus('present')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  ✓ সবাই উপস্থিত
                </button>
                <button
                  type="button"
                  onClick={() => setAllStatus('absent')}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  ✕ সবাই অনুপস্থিত
                </button>
              </div>

              <button
                type="button"
                disabled={saving || totalStudents === 0}
                onClick={handleSaveAttendance}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>হাজিরা সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time stats card */}
          <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                আজকের উপস্থিতি পরিসংখ্যান
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{currentRate}%</span>
                <span className="text-xs text-slate-500">উপস্থিতির হার</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 dark:border-[#262b34] text-center">
              <div>
                <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</span>
                <span className="text-[10px] text-slate-400">উপস্থিত</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">{lateCount}</span>
                <span className="text-[10px] text-slate-400">দেরি</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-rose-600 dark:text-rose-400">{absentCount}</span>
                <span className="text-[10px] text-slate-400">অনুপস্থিত</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-blue-600 dark:text-blue-400">{excusedCount}</span>
                <span className="text-[10px] text-slate-400">ছুটি</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Attendance Table */}
        <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-[#262b34] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              শিক্ষার্থী তালিকা ({totalStudents} জন)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              তারিখ: {formatBDDate(selectedDate)}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">হাজিরা লোড হচ্ছে...</div>
          ) : totalStudents === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">এই ব্যাচে কোনো সক্রিয় শিক্ষার্থী ভর্তি নেই।</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#262b34]">
              {records.map((student, idx) => (
                <div
                  key={student.gravId}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-[#151921]/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="text-xs font-mono text-slate-400 w-5">{idx + 1}.</span>
                    <UserAvatar name={student.studentName} avatarUrl={student.avatarUrl} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {student.studentName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        #{student.gravId}
                      </div>
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateStudentStatus(student.gravId, 'present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        student.status === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#151921] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      উপস্থিত
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStudentStatus(student.gravId, 'late')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        student.status === 'late'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#151921] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      দেরি
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStudentStatus(student.gravId, 'absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        student.status === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#151921] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      অনুপস্থিত
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStudentStatus(student.gravId, 'excused')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        student.status === 'excused'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#151921] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      ছুটি
                    </button>
                  </div>

                  {/* Note Input */}
                  <div className="sm:max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="মন্তব্য (ঐচ্ছিক)"
                      value={student.note}
                      onChange={(e) => updateStudentNote(student.gravId, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-[11px] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Sessions History */}
        {sessions.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-orange-500" />
              পূর্ববর্তী ক্লাসের হাজিরা হিস্ট্রি ({sessions.length}টি ক্লাস)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.map((sess) => (
                <div
                  key={sess._id}
                  onClick={() => setSelectedDate(sess.date)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedDate === sess.date
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                      : 'border-slate-200/70 dark:border-[#262b34] bg-slate-50/50 dark:bg-[#151921] hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-slate-900 dark:text-white">{formatBDDate(sess.date)}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sess.attendanceRate >= 80
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : sess.attendanceRate >= 50
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {sess.attendanceRate}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mb-2">
                    {sess.topic || 'টপিক উল্লেখ নেই'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-[#262b34]">
                    <span>উপস্থিত: {sess.presentCount + sess.lateCount}/{sess.total}</span>
                    <span>শিক্ষক: {sess.takenByName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER: STUDENT & GUARDIAN VIEW (PERSONAL ATTENDANCE)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#262b34] pb-5">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          {user?.role === 'guardian'
            ? `${studentStats?.ward?.name || 'সন্তানের'} ক্লাসরুম উপস্থিতি`
            : 'আমার ক্লাসরুম উপস্থিতি'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          এই ব্যাচে ক্লাসের হাজিরা ও উপস্থিতির হার।
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">উপস্থিতি তথ্য লোড হচ্ছে...</div>
      ) : !studentStats || studentStats.totalClasses === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34]">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            এই ব্যাচে এখনো কোনো ডিজিটাল হাজিরা গ্রহণ করা হয়নি।
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] text-center">
              <span className="text-xs text-slate-500 block mb-1">মোট ক্লাস</span>
              <strong className="text-2xl font-black text-slate-900 dark:text-white">
                {studentStats.totalClasses}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] text-center">
              <span className="text-xs text-slate-500 block mb-1">উপস্থিত দিন</span>
              <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {studentStats.presentCount + studentStats.lateCount}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] text-center">
              <span className="text-xs text-slate-500 block mb-1">অনুপস্থিত দিন</span>
              <strong className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {studentStats.absentCount}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] text-center">
              <span className="text-xs text-slate-500 block mb-1">উপস্থিতির হার</span>
              <strong className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {studentStats.attendanceRate}%
              </strong>
            </div>
          </div>

          {/* History Table */}
          <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[#262b34]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ক্লাস অনুযায়ী উপস্থিতির রেকর্ড
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#262b34]">
              {studentStats.history.map((h, i) => (
                <div
                  key={i}
                  className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/70 dark:hover:bg-[#151921]/50 transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatBDDate(h.date)}
                    </div>
                    {h.topic && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{h.topic}</div>
                    )}
                    {h.note && (
                      <div className="text-[10px] text-slate-400 italic mt-0.5">
                        মন্তব্য: {h.note}
                      </div>
                    )}
                  </div>

                  <div>
                    {h.status === 'present' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3.5 h-3.5" /> উপস্থিত
                      </span>
                    ) : h.status === 'late' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5" /> বিলম্ব/দেরি
                      </span>
                    ) : h.status === 'absent' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <X className="w-3.5 h-3.5" /> অনুপস্থিত
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ছুটি
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
