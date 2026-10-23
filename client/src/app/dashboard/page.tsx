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
  GraduationCap,
  ExternalLink,
  ChevronRight,
  MessageSquare,
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
  meetingUrl?: string;
  status: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/batches');
      if (res.data?.success) {
        setBatches(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* 1. Aesthetic Textured Header Banner */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-9 border border-blue-100/80 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50/90 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 shadow-xs">
          
          {/* Subtle Ambient Texture / Gradient Glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-400/10 dark:bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-10 bottom-2 opacity-5 dark:opacity-10 pointer-events-none hidden sm:block">
            <GraduationCap className="w-52 h-52 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-xs font-bold mb-3 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>স্টুডেন্ট লার্নিং পোর্টাল</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                স্বাগতম, {user?.name || 'শিক্ষার্থী'}!
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
                আপনার ক্লাস রুটিন অনুযায়ী সময়মতো সরাসরি Google Meet ক্লাসরুমে প্রবেশ করুন এবং পাঠ্যক্রমের স্টাডি ম্যাটেরিয়াল রিভিশন করুন।
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-start md:self-auto shrink-0">
              <Link
                href="/free-classes"
                className="px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 transition-all shadow-xs backdrop-blur-xs hover:border-slate-300"
              >
                <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>ফ্রি ক্লাসসমূহ</span>
              </Link>
              <Link
                href="/courses"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>সকল কোর্স</span>
              </Link>
            </div>
          </div>

        </div>

        {/* 2. Primary Feature: Interactive Daily & Weekly Class Schedule */}
        <DailyScheduleView
          role="student"
          title="আজকের ও সাপ্তাহিক ক্লাস রুটিন"
        />

        {/* 3. Enrolled Batches: Curriculum & Study Materials */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>আপনার সক্রিয় ব্যাচ ও পাঠ্যক্রম</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                প্রতিটি ব্যাচের অধ্যায়ভিত্তিক রেকর্ড ক্লাস, লেকচার নোট ও পরীক্ষার ম্যাটেরিয়াল এক নজরে
              </p>
            </div>
            <Link href="/courses" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold hidden sm:inline">
              সকল কোর্স তালিকা →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse shadow-xs" />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <div className="rounded-2xl p-10 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center shadow-xs max-w-lg mx-auto">
              <Compass className="w-10 h-10 text-slate-400 mx-auto mb-2.5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">আপনি এখনো কোনো ব্যাচে এনরোল করেননি</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                আপনার ক্লাসের উপযুক্ত কোর্স নির্বাচন করে ব্যাচে যুক্ত হয়ে নিয়মিত ক্লাসে অংশ নিন।
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                কোর্স তালিকা দেখুন
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {batches.map((batch) => (
                <div
                  key={batch._id}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Sleek Top Banner featuring Batch Name & Course Title */}
                  <div className="relative p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 text-white overflow-hidden">
                    {/* Decorative Ambient circles */}
                    <div className="w-32 h-32 rounded-full bg-white/10 blur-xl absolute -right-8 -top-8 pointer-events-none" />
                    <div className="w-24 h-24 rounded-full bg-indigo-400/20 blur-md absolute -left-6 -bottom-6 pointer-events-none" />

                    <div className="relative z-10">
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight line-clamp-1">
                        {batch.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-blue-100 line-clamp-1 mt-1">
                        {batch.courseId?.title}
                      </p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Routine Box without bg */}
                      <div className="flex items-start gap-3 pt-1">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            সাপ্তাহিক শিডিউল
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block mt-0.5 leading-snug">
                            {batch.scheduleText || 'সাপ্তাহিক নিয়মিত রুটিন অনুযায়ী'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Classroom & Study Material CTA */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                      <Link
                        href={`/classroom/${batch._id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/80 dark:border-emerald-800/60 transition-all shrink-0"
                        title="ব্যাচ ক্লাসরুম, ডিসকাশন ও এনাউন্সমেন্ট"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>ভিউ ক্লাসরুম</span>
                      </Link>

                      <Link
                        href={`/learn/${batch._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all duration-200 group-hover:shadow-md shrink-0"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        <span>স্টাডি ম্যাটেরিয়াল</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Helpline & Support Footer Strip */}
        <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">ক্লাস বা পড়া বুঝতে যেকোনো সমস্যায় সহায়তা</span>
              <span className="text-slate-500 dark:text-slate-400">আমাদের শিক্ষক ও একাডেমিক কেয়ার টিম সকাল ১০টা থেকে রাত ১০টা পর্যন্ত সক্রিয়।</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200/80 dark:border-blue-800/60">
              হটলাইন: 16910
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
