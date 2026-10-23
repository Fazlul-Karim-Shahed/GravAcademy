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
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span>আপনার সক্রিয় ব্যাচ ও পাঠ্যক্রম</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                প্রতিটি ব্যাচের অধ্যায়ভিত্তিক রেকর্ড ক্লাস, লেকচার নোট ও পরীক্ষার ম্যাটেরিয়াল এক নজরে
              </p>
            </div>
            <Link href="/courses" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-black hidden sm:flex items-center gap-1">
              <span>সকল কোর্স তালিকা</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-[34px] bg-white/70 dark:bg-slate-900/70 border-2 border-slate-200/80 dark:border-slate-800/80 animate-pulse overflow-hidden p-3"
                >
                  <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[26px]" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : batches.length === 0 ? (
            <div className="rounded-[34px] p-12 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/90 text-center shadow-lg max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-100/80 dark:bg-blue-950/60 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
                <Compass className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">আপনি এখনো কোনো ব্যাচে এনরোল করেননি</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-6 leading-relaxed">
                আপনার ক্লাসের উপযুক্ত কোর্স নির্বাচন করে ব্যাচে যুক্ত হয়ে নিয়মিত ক্লাসে অংশ নিন।
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all"
              >
                <span>কোর্স তালিকা দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {batches.map((batch, idx) => {
                // Vibrant card themes matching homepage
                const cardThemes = [
                  {
                    gradient: 'from-[#4f46e5] via-[#7c3aed] to-[#c026d3]',
                    accentColor: 'text-purple-600 dark:text-purple-400',
                  },
                  {
                    gradient: 'from-[#0284c7] via-[#2563eb] to-[#4f46e5]',
                    accentColor: 'text-blue-600 dark:text-blue-400',
                  },
                  {
                    gradient: 'from-[#059669] via-[#0d9488] to-[#0284c7]',
                    accentColor: 'text-teal-600 dark:text-teal-400',
                  },
                  {
                    gradient: 'from-[#ea580c] via-[#e11d48] to-[#c026d3]',
                    accentColor: 'text-rose-600 dark:text-rose-400',
                  },
                  {
                    gradient: 'from-[#d97706] via-[#ea580c] to-[#e11d48]',
                    accentColor: 'text-amber-600 dark:text-amber-400',
                  },
                ];

                const currentTheme = cardThemes[idx % cardThemes.length];

                return (
                  <div
                    key={batch._id}
                    className="cute-course-card group rounded-[34px] overflow-hidden flex flex-col justify-between p-2.5 sm:p-3 border-2 border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/70 dark:hover:border-purple-500/70 transition-all duration-300 shadow-md hover:shadow-xl"
                  >
                    <div>
                      {/* Top Thumbnail Banner with Curved Mask */}
                      <div className="relative w-full aspect-[16/9.5] rounded-[26px] overflow-hidden border border-slate-200/60 dark:border-white/10 shadow-sm">
                        <div className={`relative w-full h-full bg-gradient-to-br ${currentTheme.gradient} p-5 sm:p-6 flex flex-col justify-center`}>
                          
                          {/* Top Badges Overlay */}
                          <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
                            {/* Grade Level Tag */}
                            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black border border-white/25 shadow-md flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>{batch.courseId?.gradeLevel || 'একাডেমিক'}</span>
                            </span>

                            {/* Cute Live Indicator */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-[11px] font-black shadow-md border border-slate-200/60 dark:border-white/15">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                                <span className="relative m-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                              </span>
                              <span>এনরোল্ড ব্যাচ</span>
                            </span>
                          </div>

                          <div className="relative z-10 pt-4">
                            <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider block mb-0.5">
                              {batch.courseId?.subject || 'একাডেমিক কোর্স'}
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight line-clamp-1 drop-shadow-md">
                              {batch.name}
                            </h3>
                            <p className="text-xs font-semibold text-blue-100 line-clamp-1 mt-0.5 drop-shadow-sm">
                              {batch.courseId?.title}
                            </p>
                          </div>

                          {/* Gloss Sheen Shine Across Thumbnail */}
                          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-card-sheen" />
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="px-3.5 sm:px-4 pb-3 pt-3.5">
                        {/* Batch Name */}
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {batch.name}
                        </h3>

                        {/* Course Title */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-semibold leading-relaxed mt-1">
                          {batch.courseId?.title}
                        </p>

                        {/* Weekly Schedule Badge */}
                        <div className="mt-3 p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
                          <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              সাপ্তাহিক শিডিউল
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {batch.scheduleText || 'সাপ্তাহিক নিয়মিত রুটিন অনুযায়ী'}
                            </span>
                          </div>
                        </div>

                        {/* Cute Feature Micro-Badges matching Home Page */}
                        <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <PlayCircle className="w-3.5 h-3.5" />
                            </div>
                            <span className="line-clamp-1">অধ্যায়ভিত্তিক রেকর্ড ক্লাস ও লাইভ রুটিন</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <span className="line-clamp-1">লেকচার শিট, হ্যান্ডনোট ও প্রশ্নব্যাংক</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cute Card Bottom: Classroom & Study Material CTA */}
                    <div className="p-3 sm:p-3.5 mt-1 rounded-[24px] border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-2 shadow-inner">
                      <Link
                        href={`/classroom/${batch._id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200/80 dark:border-emerald-800/60 transition-all shrink-0 hover:scale-102"
                        title="ব্যাচ ক্লাসরুম, ডিসকাশন ও এনাউন্সমেন্ট"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>ক্লাসরুম</span>
                      </Link>

                      <Link
                        href={`/learn/${batch._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/35 transition-all shrink-0 hover:scale-102"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-200" />
                        <span>স্টাডি ম্যাটেরিয়াল</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
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
