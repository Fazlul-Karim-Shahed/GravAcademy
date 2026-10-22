'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  BookOpen,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Video,
  PlayCircle,
  FileText,
  AlertCircle,
  Compass,
} from 'lucide-react';
import DailyScheduleView from '@/components/schedule/DailyScheduleView';

interface BatchInfo {
  _id: string;
  name: string;
  courseId: {
    _id: string;
    title: string;
    gradeLevel: string;
    subject: string;
    slug?: string;
  };
  scheduleText?: string;
  status: string;
}

interface LiveClassItem {
  _id: string;
  title: string;
  startTime: string;
  meetingUrl: string;
  provider: string;
  batchId?: {
    _id: string;
    name: string;
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch available or enrolled batches
      const [batchesRes, liveRes] = await Promise.allSettled([
        api.get('/batches'),
        api.get('/live-classes/my'),
      ]);

      if (batchesRes.status === 'fulfilled' && batchesRes.value.data?.success) {
        setBatches(batchesRes.value.data.data || []);
      }

      if (liveRes.status === 'fulfilled' && liveRes.value.data?.success) {
        setLiveClasses(liveRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const primaryBatch = batches.length > 0 ? batches[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Banner */}
        <div className="rounded-3xl p-8 mb-8 border border-slate-200/90 dark:border-slate-800 relative overflow-hidden bg-white dark:bg-gradient-to-r dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900/60 shadow-xs">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Student Learning Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name || 'শিক্ষার্থী'}!
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              আপনার সক্রিয় ব্যাচসমূহের লাইভ ক্লাস, রেকর্ডেড লেকচার, হ্যান্ডনোট এবং পরীক্ষার অগ্রগতি এক নজরে পর্যবেক্ষণ করুন।
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          {/* Metric 1 */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                চলতি ব্যাচ
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {loading ? '...' : `${batches.length} টি সক্রিয়`}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              {primaryBatch ? `${primaryBatch.courseId?.gradeLevel || ''}` : 'কোনো সক্রিয় ব্যাচ নেই'}
            </span>
          </div>

          {/* Metric 2 */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                লাইভ ক্লাস
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {loading ? '...' : `${liveClasses.length} টি শিডিউল্ড`}
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
              {liveClasses.length > 0 ? 'আসন্ন লাইভ ক্লাস রয়েছে' : 'বর্তমানে কোনো লাইভ ক্লাস নেই'}
            </span>
          </div>

          {/* Metric 3 */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                পরীক্ষা ও মূল্যায়ন
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              অনলাইন MCQ
            </div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1 block">
              স্বয়ংক্রিয় মার্কিং ও ফলাফল
            </span>
          </div>

          {/* Metric 4 */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                লার্নিং মেটেরিয়ালস
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Google Drive
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
              ক্লাস নোট ও লেকচার শিট
            </span>
          </div>

        </div>

        {/* Daily & Weekly Interactive Class Schedule */}
        <DailyScheduleView
          role="student"
          title="আজকের ও সাপ্তাহিক ক্লাস রুটিন"
          subtitle="প্রতিদিনের নির্দিষ্ট ক্লাস সময় ও বিষয়ভিত্তিক রুটিন অনুযায়ী সময়মতো ক্লাসে উপস্থিত থাকুন"
        />

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Batches & Resume Learning */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /> আপনার এনরোল করা ব্যাচসমূহ
              </h2>
              <Link href="/courses" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold">
                সকল কোর্স ব্রাউজ করুন →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 rounded-3xl bg-slate-200/60 dark:bg-slate-900/60 animate-pulse border border-slate-200/80 dark:border-slate-800" />
                ))}
              </div>
            ) : batches.length === 0 ? (
              <div className="rounded-3xl p-10 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center shadow-xs">
                <Compass className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">আপনি এখনো কোনো ব্যাচে যুক্ত হননি</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  আপনার ক্লাসের উপযুক্ত কোর্স নির্বাচন করে যেকোনো লাইভ ব্যাচে যুক্ত হয়ে ক্লাস শুরু করুন।
                </p>
                <Link
                  href="/courses"
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  কোর্স তালিকা দেখুন
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div
                    key={batch._id}
                    className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-400/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
                            {batch.courseId?.gradeLevel || 'Class 6 - 12'}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 uppercase">
                            {batch.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {batch.name}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {batch.courseId?.title}
                        </p>
                      </div>

                      <Link
                        href={`/learn/${batch._id}`}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0"
                      >
                        <PlayCircle className="w-4 h-4" /> ক্লাসরুমে প্রবেশ করুন
                      </Link>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        শিডিউল: {batch.scheduleText || 'নিয়মিত ব্যাচ রুটিন'}
                      </span>
                      <Link
                        href={`/courses/${batch.courseId?.slug || batch.courseId?._id}`}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        কোর্স বিস্তারিত →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Classes & Routine Notices */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> লাইভ ক্লাসের সময়সূচি
            </h2>

            <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              {liveClasses.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">কোনো লাইভ ক্লাস নেই</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    শিক্ষক নতুন লাইভ ক্লাস শিডিউল করলে এখানে সরাসরি লিংক দেখতে পাবেন।
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveClasses.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                          {item.provider.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      {item.batchId && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.batchId.name}</p>
                      )}

                      <a
                        href={item.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" /> লাইভ ক্লাসে যোগ দিন
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Helpline and Guidelines */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-900/80 border border-blue-200/60 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" /> যেকোনো প্রয়োজনে হেল্পলাইন
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                ক্লাস করতে কোনো সমস্যা হলে বা রেকর্ডেড ভিডিও ওপেন না হলে আমাদের হটলাইন নম্বরে সরাসরি যোগাযোগ করতে পারেন:
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-slate-700 shadow-xs">
                  📞 16910
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">সকাল ১০টা - রাত ১০টা</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
