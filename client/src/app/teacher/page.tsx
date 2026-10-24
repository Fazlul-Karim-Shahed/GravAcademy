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
        setBatches(res.data.data || []);
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
        <div className="rounded-3xl p-8 mb-8 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-gradient-to-r dark:from-indigo-950/40 dark:via-blue-950/20 dark:to-slate-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Instructor Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Teacher Operations Panel
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
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
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>প্রোফাইল ও সিভি এডিট</span>
            </Link>
          </div>
        </div>

        {/* Metrics Row */}
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
        </div>

        {/* Teacher Daily & Weekly Schedule Overview */}
        <DailyScheduleView
          role="teacher"
          title="শিক্ষক ক্লাস শিডিউল ও ব্যাচ রুটিন"
          subtitle="আজকে আপনার কোন কোন ব্যাচের ক্লাস আছে এবং সারা সপ্তাহের বিস্তারিত সময়সূচী"
        />

        {/* Batches Management */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Your Assigned Course Batches
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select a batch to inspect curriculum or add new educational modules.
            </p>
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
              <div key={batch._id} className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/20">
                      {batch.courseId?.gradeLevel || 'Class 6 - 12'}
                    </span>
                    <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                      {batch.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{batch.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{batch.courseId?.title}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/classroom/${batch._id}`}
                    className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    title="ক্লাসরুম, মেম্বার তালিকা ও ডিসকাশন গ্রুপে প্রবেশ করুন"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>ভিউ ক্লাসরুম</span>
                  </Link>

                  <Link
                    href={`/admin/batches/${batch._id}/curriculum`}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
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
