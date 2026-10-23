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
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch only batches the student has actually enrolled in
      const res = await api.get('/enrollments/my-batches');
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c1a] text-slate-900 dark:text-slate-100 transition-colors pb-14">
      
      {/* 1. COSMIC GLOWING HERO HEADER STRIP (Matching Home Page Cosmic Theme) */}
      <div className="relative overflow-hidden cosmic-hero-bg text-white pt-10 pb-12 sm:pt-14 sm:pb-16 mb-8 sm:mb-10">
        
        {/* Deep space radial ambient lighting & celestial nebula glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[380px] bg-gradient-to-b from-rose-950/45 via-red-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[250px] bg-red-600/15 rounded-full blur-[100px] pointer-events-none -z-10 animate-atmosphere" />
        <div className="absolute -top-10 left-1/4 w-[350px] h-[250px] bg-blue-900/15 rounded-full blur-[90px] pointer-events-none -z-10" />
        <div className="absolute -top-10 right-1/4 w-[350px] h-[250px] bg-purple-900/15 rounded-full blur-[90px] pointer-events-none -z-10" />

        {/* Twinkling Cosmic Stars & Shooting Star */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[14%] left-[10%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[24%] left-[20%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
          <div className="absolute top-[12%] right-[16%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
          <div className="absolute top-[30%] right-[10%] w-1.5 h-1.5 rounded-full bg-rose-200 animate-star-twinkle-slow" />
          <span className="shooting-star meteor-1" />
          <span className="shooting-star meteor-3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-normal leading-[1.35] text-white">
                স্বাগতম,{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 pt-1 pb-2 px-1">
                  {user?.name || 'শিক্ষার্থী'}!
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl font-medium leading-relaxed">
                আপনার ক্লাস রুটিন অনুযায়ী সময়মতো সরাসরি লাইভ ক্লাসরুমে প্রবেশ করুন এবং পাঠ্যক্রমের স্টাডি ম্যাটেরিয়াল রিভিশন করুন।
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
              <Link
                href="/free-classes"
                className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all shadow-md hover:scale-102"
              >
                <Video className="w-4 h-4 text-emerald-400" />
                <span>ফ্রি লাইভ ক্লাস</span>
              </Link>
              <Link
                href="/courses"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-102"
              >
                <BookOpen className="w-4 h-4" />
                <span>সকল কোর্স</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* 2. Primary Feature: Interactive Daily & Weekly Class Schedule */}
        <DailyScheduleView
          role="student"
          title="আজকের ও সাপ্তাহিক ক্লাস রুটিন"
        />

        {/* 3. Enrolled Batches: Curriculum & Study Materials */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span>আপনার সক্রিয় ব্যাচসমূহ</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                ক্লাসরুম ও পাঠ্যক্রমের স্টাডি ম্যাটেরিয়ালে সরাসরি প্রবেশ করুন
              </p>
            </div>
            <Link href="/courses" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-black hidden sm:flex items-center gap-1">
              <span>সকল কোর্স তালিকা</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse p-5 space-y-4"
                >
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : batches.length === 0 ? (
            <div className="rounded-2xl p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">কোনো ব্যাচে এখনো এনরোল করা হয়নি</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
                কোর্স ক্যাটালগ থেকে আপনার শ্রেণির ব্যাচে যুক্ত হন।
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                <span>কোর্স ক্যাটালগ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {batches.map((batch) => (
                <div
                  key={batch._id}
                  className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-blue-400/80 dark:hover:border-blue-500/80 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-3">
                    {/* Class Tag */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                        {batch.courseId?.gradeLevel || 'একাডেমিক'}
                      </span>
                    </div>

                    {/* Course Title as Primary Heading */}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {batch.courseId?.title || batch.name}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                        ব্যাচ: <span className="font-bold">{batch.name}</span>
                      </p>
                    </div>
                  </div>

                  {/* Student Action Bar: Direct Classroom & Study Material Entry */}
                  <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
                    <Link
                      href={`/classroom/${batch._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                      title="নোটিশ ও সহপাঠীদের ডিসকাশন"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>ক্লাসরুম</span>
                    </Link>

                    <Link
                      href={`/learn/${batch._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                      title="রেকর্ড ক্লাস ও পড়ালেখার ম্যাটেরিয়াল"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-100" />
                      <span>পড়া শুরু করুন</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Helpline & Support Strip */}
        <div className="rounded-[30px] p-5 sm:p-6 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/90 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-black text-sm text-slate-900 dark:text-white block">ক্লাস বা পড়া বুঝতে যেকোনো সমস্যায় সার্বক্ষণিক সহায়তা</span>
              <span className="text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">আমাদের শিক্ষক ও একাডেমিক কেয়ার টিম সকাল ১০টা থেকে রাত ১০টা পর্যন্ত সক্রিয়।</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="font-black text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20">
              📞 হেল্পলাইন: 16910
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
