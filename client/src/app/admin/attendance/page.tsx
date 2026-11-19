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
  CalendarDays,
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
  const [selectedDate, setSelectedDate] = useState('');
  const [teacherFilterLoading, setTeacherFilterLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadTeachers = useCallback(async (date = '') => {
    setTeacherFilterLoading(true);
    try {
      const response = await api.get('/teacher-attendance/teachers', { params: date ? { date } : undefined });
      setTeachers(response.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'শিক্ষক তালিকা লোড হয়নি।');
    } finally {
      setTeacherFilterLoading(false);
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

  const markAbsent = async (row: RunningClass) => {
    const key = `${row.teacher._id}:${row.batchId}`;
    setMarkingKey(key);
    setError('');
    setNotice('');
    try {
      const response = await api.post('/teacher-attendance/mark-absent', {
        teacherId: row.teacher._id,
        batchId: row.batchId,
        date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }),
      });
      setNotice(response.data.message || 'Attendance Absent করা হয়েছে।');
      await loadQuick(true);
      await loadTeachers();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Attendance সংশোধন করা যায়নি।');
    } finally {
      setMarkingKey(null);
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.name} ${teacher.gravId || ''} ${teacher.email || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const quickGroups = Array.from(running.reduce((groups, row) => {
    const group = groups.get(row.batchId);
    if (group) group.push(row);
    else groups.set(row.batchId, [row]);
    return groups;
  }, new Map<string, RunningClass[]>()).values());

  if (!canManage) {
    return <main className="min-h-screen bg-slate-50 dark:bg-[#0b0d12] px-4 py-12 text-center text-slate-600 dark:text-slate-400">এই পেজ দেখার permission নেই।</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-6 text-slate-900 dark:bg-[#0b0d12] dark:text-slate-100 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-[#262b34] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold text-orange-600 dark:text-orange-400">শিক্ষক ব্যবস্থাপনা</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">শিক্ষক হাজিরা</h1>
          </div>
          <button onClick={() => { loadQuick(); loadTeachers(selectedDate); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-200 dark:hover:border-orange-500/40">
            <RefreshCw className={`h-4 w-4 ${quickLoading ? 'animate-spin' : ''}`} /> রিফ্রেশ
          </button>
        </header>

        {notice && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</div>}
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

        <section className="mb-10" aria-labelledby="quick-attendance-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="quick-attendance-title" className="flex items-center gap-2 text-lg font-bold sm:text-xl"><Clock3 className="h-5 w-5 text-orange-500" /> Quick Attendance</h2>
            </div>
          </div>
          {quickLoading && running.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-[#262b34] dark:bg-[#111318]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> লোড হচ্ছে</div>
          ) : running.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-9 text-center dark:border-[#262b34] dark:bg-[#111318]">
              <Clock3 className="mx-auto mb-2 h-7 w-7 text-slate-400" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">আজ কোনো scheduled class নেই</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {quickGroups.map((group) => {
                const first = group[0];
                const selected = group.find((row) => row.attendance?.status === 'present');
                return (
                  <article key={first.batchId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#262b34] dark:bg-[#111318]">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1 border-b border-slate-100 pb-3 dark:border-[#262b34]">
                      <div><h3 className="font-bold">{first.courseName} · {first.batchName}</h3><p className="mt-1 text-sm text-slate-500">{timeLabel(first.startTime, first.endTime)}</p></div>
                      <span className="text-xs font-medium text-slate-500">{group.length} জন শিক্ষক</span>
                    </div>
                    <div className="space-y-2">
                      {group.map((row) => {
                        const key = `${row.teacher._id}:${row.batchId}`;
                        return <div key={key} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-[#151921]">
                          <UserAvatar name={row.teacher.name} avatarUrl={row.teacher.avatarUrl} role="teacher" size="md" />
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{row.teacher.name}</p>{row.teacher.gravId && <p className="text-xs text-slate-500">{row.teacher.gravId}</p>}</div>
                          {row.attendance?.status === 'present' ? <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><UserCheck className="h-4 w-4" /> Present</span><button type="button" onClick={() => markAbsent(row)} disabled={markingKey !== null} className="min-h-10 rounded-xl border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300">Absent করুন</button></div> : <button type="button" onClick={() => markPresent(row)} disabled={markingKey !== null || Boolean(selected)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-3 text-sm font-semibold text-white shadow-sm shadow-orange-950/20 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-800"><UserCheck className="h-4 w-4" /> Mark as Present</button>}
                        </div>;
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="manual-attendance-title">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="manual-attendance-title" className="flex items-center gap-2 text-lg font-bold sm:text-xl"><CalendarCheck className="h-5 w-5 text-orange-500" /> Manual Attendance</h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex gap-2">
                <label className="relative block min-w-0 flex-1 sm:w-44 sm:flex-none">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="date" aria-label="Class date filter" value={selectedDate} onChange={(event) => { const date = event.target.value; setSelectedDate(date); setError(''); void loadTeachers(date); }} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-2 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200 dark:focus:ring-orange-950/30" />
                </label>
                {selectedDate && <button type="button" onClick={() => { setSelectedDate(''); setError(''); void loadTeachers(''); }} className="shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#262b34] dark:text-slate-300 dark:hover:bg-[#151921]">সব দিন</button>}
              </div>
              <label className="relative block w-full sm:w-52">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Teacher খুঁজুন" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200 dark:focus:ring-orange-950/30" />
              </label>
            </div>
          </div>

          {loading || teacherFilterLoading ? (
            <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-[#262b34] dark:bg-[#111318]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> লোড হচ্ছে</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-[#262b34] dark:bg-[#111318]">
              <Users className="mx-auto mb-2 h-7 w-7 text-slate-400" />
              <p className="font-semibold">{selectedDate ? 'এই দিনে কোনো teacher-এর class নেই' : 'কোনো teacher পাওয়া যায়নি'}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTeachers.map((teacher) => (
                <article key={teacher._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#262b34] dark:bg-[#111318] sm:flex-row sm:items-center">
                  <UserAvatar name={teacher.name} avatarUrl={teacher.avatarUrl} role="teacher" size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{teacher.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      {teacher.gravId && <span>Grav ID: {teacher.gravId}</span>}
                      <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{teacher.batchCount} batch</span>
                      <span>{teacher.historyCount} attendance</span>
                    </div>
                  </div>
                  <Link href={`/admin/attendance/${teacher._id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-[#262b34] dark:text-slate-200 dark:hover:bg-orange-950/30 dark:hover:text-orange-400">
                    Attendance & Payment <ArrowRight className="h-4 w-4" />
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
