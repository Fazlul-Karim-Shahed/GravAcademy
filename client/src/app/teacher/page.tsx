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
  Banknote,
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
  const [loadError, setLoadError] = useState('');

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
    setLoadError('');
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
      setLoadError('ব্যাচের তথ্য লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  return (
    <div className="ga-page ga-dashboard-page text-slate-900 dark:text-slate-100 transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-[#262b34] sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">Teaching workspace</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              শিক্ষক ড্যাশবোর্ড
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              আজকের ক্লাস, ব্যাচ ও একাডেমিক কাজ এক জায়গা থেকে পরিচালনা করুন।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <Link
              href="/teacher/payments"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Banknote className="w-4 h-4" />
              <span>Payment</span>
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#111318] hover:bg-slate-100 dark:hover:bg-[#151921] text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-[#262b34] shadow-2xs"
            >
              <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>আমার প্রোফাইল</span>
            </Link>
          </div>
        </header>

        <section className="ga-operation-toolbar mb-8">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400">কাজের ব্যাচ</label>
            <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-200 sm:max-w-sm">
            {batches.length === 0 ? <option value="">কোনো assigned batch নেই</option> : batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.name} — {batch.courseId?.title}</option>)}
            </select>
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Teacher quick actions">
          {[
            { href: selectedBatchId ? `/classroom/${selectedBatchId}` : '#batches', label: 'আজকের ক্লাস', icon: Video },
            { href: selectedBatchId ? `/classroom/${selectedBatchId}/assignments` : '#batches', label: 'অ্যাসাইনমেন্ট', icon: FileCheck2 },
            { href: selectedBatchId ? `/classroom/${selectedBatchId}/exams` : '#batches', label: 'এক্সাম', icon: GraduationCap },
            { href: selectedBatchId ? `/admin/batches/${selectedBatchId}/curriculum` : '#batches', label: 'লেকচার ও শিট', icon: Upload },
          ].map((action) => {
            const Icon = action.icon;
            return <Link key={action.label} href={action.href} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-200 dark:hover:border-orange-700 dark:hover:text-orange-400">
              <Icon className="h-4 w-4" />
              <span>{action.label}</span>
            </Link>;
          })}
          </nav>
        </section>

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
              <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" /> আপনার নির্ধারিত কোর্স ব্যাচ
            </h2>
          </div>

          <button
            onClick={() => user?.id && loadTeacherBatches(user.id, true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#151921] transition-colors shadow-2xs cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-600 dark:text-orange-400 ${loading ? 'animate-spin' : ''}`} />
            <span>আপডেট করুন</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-200/60 dark:bg-[#111318]/60 animate-pulse border border-slate-200/80 dark:border-[#262b34]" />
            ))}
          </div>
        ) : loadError ? (
          <div className="ga-card p-10 text-center">
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">তথ্য লোড করা যায়নি</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{loadError}</p>
            <button onClick={() => user?.id && loadTeacherBatches(user.id, true)} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700">আবার চেষ্টা করুন</button>
          </div>
        ) : batches.length === 0 ? (
          <div className="ga-card p-12 text-center">
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
              <div key={batch._id} className="rounded-xl p-4 bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] flex flex-col justify-between transition-colors hover:border-orange-500/70">
                <div>
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {batch.courseId?.gradeLevel || 'Class 6 - 12'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                      {batch.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{batch.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{batch.courseId?.title}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#262b34] flex items-center gap-2">
                  <Link
                    href={`/classroom/${batch._id}`}
                    className="flex-1 min-w-0 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-950/25"
                    title="ক্লাসরুম, মেম্বার তালিকা ও ডিসকাশন গ্রুপে প্রবেশ করুন"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>ভিউ ক্লাসরুম</span>
                  </Link>

                  <Link
                    href={`/admin/batches/${batch._id}/curriculum`}
                    className="py-2 px-3 rounded-lg border border-slate-200 dark:border-[#262b34] text-slate-700 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
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
