'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import {
  GraduationCap,
  Layers,
  BookOpen,
  FileCheck2,
  Video,
  Upload,
  PlusCircle,
  Users,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  User,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import DailyScheduleView from '@/components/schedule/DailyScheduleView';

import { usePathname } from 'next/navigation';

interface Batch {
  _id: string;
  name: string;
  status: string;
  courseId: {
    title: string;
    gradeLevel: string;
    subject?: string;
  };
  scheduleText?: string;
  capacity?: number;
}

export default function TeacherPanelPage() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (user?.id) {
      loadTeacherBatches(user.id);
    } else {
      setBatches([]);
      setLoading(false);
    }

    // Also auto-refresh when tab/window is refocused
    const handleFocus = () => {
      if (user?.id) {
        loadTeacherBatches(user.id, false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, authLoading, pathname]);

  const loadTeacherBatches = async (teacherId: string, showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      // Add timestamp query parameter to bypass browser/axios cache on page switch
      const res = await api.get(`/batches?teacherId=${teacherId}&_t=${Date.now()}`);
      if (res.data.success) {
        const nextBatches = res.data.data || [];
        setBatches(nextBatches);
        setSelectedBatchId((current) => current && nextBatches.some((b: Batch) => b._id === current) ? current : nextBatches[0]?._id || '');
      }
    } catch (err) {
      console.error('Error fetching teacher batches:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Teacher Dashboard
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Teacher Dashboard
            </h1>
            <p className="hidden mt-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Manage your assigned batches, upload lesson notes and worksheets, schedule live sessions, and review student progress.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
            >
              <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>আমার প্রোফাইল</span>
            </Link>
          </div>
        </div>

        {/* Teacher-first quick actions: daily work only. */}
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">কাজের ব্যাচ নির্বাচন করুন</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">একাধিক batch থাকলে যেটিতে কাজ করবেন সেটি বেছে নিন।</p></div>
          <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="w-full sm:w-80 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500">
            {batches.length === 0 ? <option value="">কোনো assigned batch নেই</option> : batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.name} — {batch.courseId?.title}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { href: selectedBatchId ? `/classroom/${selectedBatchId}` : '#batches', label: 'আজকের ক্লাস', icon: Video },
            { href: selectedBatchId ? `/classroom/${selectedBatchId}/assignments` : '#batches', label: 'অ্যাসাইনমেন্ট', icon: FileCheck2 },
            { href: selectedBatchId ? `/classroom/${selectedBatchId}/exams` : '#batches', label: 'এক্সাম', icon: GraduationCap },
            { href: selectedBatchId ? `/admin/batches/${selectedBatchId}/curriculum` : '#batches', label: 'লেকচার ও শিট', icon: Upload },
          ].map((action) => {
            const Icon = action.icon;
            return <Link key={action.label} href={action.href} className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all">
              <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-3" />
              <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">{action.label}</span>
              <span className="text-[11px] text-slate-400 mt-1 block">দ্রুত প্রবেশ করুন</span>
            </Link>;
          })}
        </div>
        {/* Legacy metric cards removed: the teacher dashboard should focus on work. */}
        {/*
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Assigned Batches</span>
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{batches.length} Batches</div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 block">Class 6 to Class 10</span>
          </div>

          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Live Sessions</span>
              <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">Active</div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Zoom & Meet Dispatch</span>
          </div>

          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Examinations</span>
              <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">MCQ Evaluated</div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1 block">Server-Side Auto-Grading</span>
          </div>

          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Google Drive Pipeline</span>
              <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">Ready</div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">Auto-Sync Enabled</span>
          </div>
        </div> */}

        {/* Teacher Daily & Weekly Schedule Overview */}
        <div id="schedule"><DailyScheduleView
          role="teacher"
          cardless
          title="শিক্ষক ক্লাস শিডিউল ও ব্যাচ রুটিন"
        /></div>

        {/* Batches Management */}
        <div id="batches" className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> আপনার নির্ধারিত কোর্স ব্যাচ
            </h2>
          </div>

          <button
            onClick={() => user?.id && loadTeacherBatches(user.id, true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>আপডেট করুন</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 animate-pulse border border-slate-200/80 dark:border-slate-800" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="rounded-3xl p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              আপনাকে এখনো কোনো ব্যাচ বা কোর্সে অ্যাসাইন করা হয়নি
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              অ্যাডমিন যখন আপনাকে কোনো কোর্স বা ব্যাচে শিক্ষক হিসেবে নিযুক্ত করবেন, তখন সেগুলো এখানে স্বয়ংক্রিয়ভাবে দৃশ্যমান হবে।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <div key={batch._id} className="rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors hover:border-emerald-400 dark:hover:border-emerald-500/70">
                <div>
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {batch.courseId?.gradeLevel || 'Class 6 - 12'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      {batch.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{batch.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{batch.courseId?.title}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Link
                    href={`/classroom/${batch._id}`}
                    className="flex-1 min-w-0 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    title="ক্লাসরুম, মেম্বার তালিকা ও ডিসকাশন গ্রুপে প্রবেশ করুন"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>ভিউ ক্লাসরুম</span>
                  </Link>

                  <Link
                    href={`/admin/batches/${batch._id}/curriculum`}
                    className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    title="কারিকুলাম, লেকচার ও শিট ম্যানেজ করুন"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>কারিকুলাম ও লেকচার</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
