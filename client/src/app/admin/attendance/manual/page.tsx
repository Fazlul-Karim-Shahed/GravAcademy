'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarCheck, CalendarDays, GraduationCap, LoaderCircle, Search, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserAvatar } from '@/components/common/UserAvatar';

interface Teacher {
  _id: string;
  name: string;
  gravId?: string;
  email?: string;
  avatarUrl?: string;
  batchCount: number;
  historyCount: number;
}

export default function ManualTeacherAttendancePage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, PERMISSIONS.ATTENDANCE_MANAGE);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');

  const loadTeachers = useCallback(async (date = '') => {
    setLoading(true);
    try {
      const response = await api.get('/teacher-attendance/teachers', { params: date ? { date } : undefined });
      setTeachers(response.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'শিক্ষক তালিকা লোড হয়নি।');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    void loadTeachers();
  }, [canManage, loadTeachers]);

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.name} ${teacher.gravId || ''} ${teacher.email || ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  if (!canManage) return <main className="min-h-screen bg-slate-50 px-4 py-12 text-center text-slate-600 dark:bg-[#0b0d12] dark:text-slate-400">এই পেজ দেখার permission নেই।</main>;

  return <main className="ga-page ga-admin-page py-6 text-slate-900 dark:text-slate-100 sm:py-10">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="mb-7 grid gap-4 border-b border-slate-200 pb-5 dark:border-[#262b34] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <Link href="/admin/attendance" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"><ArrowLeft className="h-3.5 w-3.5" /> Quick Attendance</Link>
          <p className="mb-1 text-sm font-semibold text-orange-600 dark:text-orange-400">শিক্ষক ব্যবস্থাপনা</p>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"><CalendarCheck className="h-6 w-6 text-orange-500" /> Manual Attendance</h1>
        </div>
      </header>

      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

      <section aria-label="Manual attendance teachers">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-bold sm:text-xl">শিক্ষক বেছে নিন</h2><p className="mt-1 text-sm text-slate-500">Attendance ও payment history দেখতে একজন শিক্ষক বেছে নিন।</p></div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <label className="relative block min-w-0 flex-1 sm:w-44 sm:flex-none"><CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="date" aria-label="Class date filter" value={selectedDate} onChange={(event) => { const date = event.target.value; setSelectedDate(date); setError(''); void loadTeachers(date); }} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-2 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200" /></label>
              {selectedDate && <button type="button" onClick={() => { setSelectedDate(''); setError(''); void loadTeachers(''); }} className="shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#262b34] dark:text-slate-300 dark:hover:bg-[#151921]">সব দিন</button>}
            </div>
            <label className="relative block w-full sm:w-52"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Teacher খুঁজুন" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200" /></label>
          </div>
        </div>

        {loading ? <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-[#262b34] dark:bg-[#111318]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> লোড হচ্ছে</div>
          : filteredTeachers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-[#262b34] dark:bg-[#111318]"><Users className="mx-auto mb-2 h-7 w-7 text-slate-400" /><p className="font-semibold">{selectedDate ? 'এই দিনে কোনো teacher-এর class নেই' : 'কোনো teacher পাওয়া যায়নি'}</p></div>
          : <div className="space-y-2.5">{filteredTeachers.map((teacher) => <article key={teacher._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#262b34] dark:bg-[#111318] sm:flex-row sm:items-center"><UserAvatar name={teacher.name} avatarUrl={teacher.avatarUrl} role="teacher" size="lg" /><div className="min-w-0 flex-1"><h3 className="truncate font-bold">{teacher.name}</h3><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">{teacher.gravId && <span>Grav ID: {teacher.gravId}</span>}<span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{teacher.batchCount} batch</span><span>{teacher.historyCount} attendance</span></div></div><Link href={`/admin/attendance/${teacher._id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-[#262b34] dark:text-slate-200 dark:hover:bg-orange-950/30 dark:hover:text-orange-400">Attendance & Payment <ArrowRight className="h-4 w-4" /></Link></article>)}</div>}
      </section>
    </div>
  </main>;
}
