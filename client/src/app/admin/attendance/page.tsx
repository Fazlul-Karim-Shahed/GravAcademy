'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';

interface Teacher {
  _id: string;
  name: string;
  gravId?: string;
  email?: string;
  avatarUrl?: string;
  batchCount: number;
  activeBatchCount: number;
  historyCount: number;
}

interface RunningClass {
  batchId: string;
  batchName: string;
  courseName: string;
  startTime: string;
  endTime: string;
  teacher: Teacher;
  attendance: { status: string; markedAt: string; source: string } | null;
}

const timeLabel = (start: string, end: string) => end ? `${start} – ${end}` : start;

export default function AdminTeacherAttendancePage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, PERMISSIONS.ATTENDANCE_MANAGE);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [running, setRunning] = useState<RunningClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickLoading, setQuickLoading] = useState(false);
  const [markingKey, setMarkingKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadTeachers = useCallback(async () => {
    try {
      const response = await api.get('/teacher-attendance/teachers');
      setTeachers(response.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'শিক্ষক তালিকা লোড হয়নি।');
    }
  }, []);

  const loadQuick = useCallback(async (silent = false) => {
    if (!silent) setQuickLoading(true);
    try {
      const response = await api.get('/teacher-attendance/quick');
      setRunning(response.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'চলমান ক্লাস লোড হয়নি।');
    } finally {
      if (!silent) setQuickLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    Promise.all([loadTeachers(), loadQuick()]).finally(() => setLoading(false));
    const timer = window.setInterval(() => loadQuick(true), 30_000);
    return () => window.clearInterval(timer);
  }, [canManage, loadTeachers, loadQuick]);

  const markPresent = async (row: RunningClass) => {
    const key = `${row.teacher._id}:${row.batchId}`;
    setMarkingKey(key);
    setError('');
    setNotice('');
    try {
      const response = await api.post('/teacher-attendance/mark', {
        teacherId: row.teacher._id,
        batchId: row.batchId,
        date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }),
        source: 'quick',
      });
      setNotice(response.data.message || 'উপস্থিতি নেওয়া হয়েছে।');
      await loadQuick(true);
      await loadTeachers();
    } catch (e: any) {
      setError(e.response?.data?.message || 'উপস্থিতি নেওয়া যায়নি।');
    } finally {
      setMarkingKey(null);
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.name} ${teacher.gravId || ''} ${teacher.email || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (!canManage) {
    return <main className="min-h-screen bg-slate-50 px-4 py-12 text-center text-slate-600">এই পেজ দেখার permission নেই।</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">শিক্ষক ব্যবস্থাপনা</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">শিক্ষক হাজিরা</h1>
          </div>
          <button onClick={() => { loadQuick(); loadTeachers(); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <RefreshCw className={`h-4 w-4 ${quickLoading ? 'animate-spin' : ''}`} /> রিফ্রেশ
          </button>
        </header>

        {notice && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</div>}
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

        <section className="mb-10" aria-labelledby="quick-attendance-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="quick-attendance-title" className="flex items-center gap-2 text-lg font-bold sm:text-xl"><Clock3 className="h-5 w-5 text-emerald-600" /> Quick Attendance</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">এই মুহূর্তে চলমান batch-এর teacher</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">প্রতি ৩০ সেকেন্ডে আপডেট</span>
          </div>
          {quickLoading && running.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> লোড হচ্ছে</div>
          ) : running.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-9 text-center dark:border-slate-700 dark:bg-slate-900">
              <Clock3 className="mx-auto mb-2 h-7 w-7 text-slate-400" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">এখন কোনো scheduled class চলছে না</p>
              <p className="mt-1 text-sm text-slate-500">Class time হলে এখানে teacher-দের তালিকা আসবে।</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {running.map((row) => {
                const key = `${row.teacher._id}:${row.batchId}`;
                return (
                  <article key={key} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
                    <UserAvatar name={row.teacher.name} avatarUrl={row.teacher.avatarUrl} role="teacher" size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-bold">{row.teacher.name}</h3>
                        {row.teacher.gravId && <span className="text-xs text-slate-500">Grav ID: {row.teacher.gravId}</span>}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-600 dark:text-slate-300">
                        <span>{row.courseName}</span><span className="text-slate-300">·</span><span>{row.batchName}</span><span className="text-slate-300">·</span><span>{timeLabel(row.startTime, row.endTime)}</span>
                      </p>
                    </div>
                    {row.attendance?.status === 'present' ? (
                      <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><UserCheck className="h-4 w-4" /> উপস্থিত</span>
                    ) : (
                      <button onClick={() => markPresent(row)} disabled={markingKey === key} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                        {markingKey === key ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Present
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="manual-attendance-title">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="manual-attendance-title" className="flex items-center gap-2 text-lg font-bold sm:text-xl"><CalendarCheck className="h-5 w-5 text-blue-600" /> Manual Attendance</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Teacher বেছে নিয়ে date ও batch অনুযায়ী attendance দেখুন</p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Teacher খুঁজুন" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-blue-950" />
            </label>
          </div>

          {loading ? (
            <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> লোড হচ্ছে</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <Users className="mx-auto mb-2 h-7 w-7 text-slate-400" />
              <p className="font-semibold">কোনো teacher পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTeachers.map((teacher) => (
                <article key={teacher._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
                  <UserAvatar name={teacher.name} avatarUrl={teacher.avatarUrl} role="teacher" size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{teacher.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      {teacher.gravId && <span>Grav ID: {teacher.gravId}</span>}
                      <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{teacher.batchCount} batch</span>
                      <span>{teacher.historyCount} attendance</span>
                    </div>
                  </div>
                  <Link href={`/admin/attendance/${teacher._id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-blue-950/30">
                    Manual Attendance <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
