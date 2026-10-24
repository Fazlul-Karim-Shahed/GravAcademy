'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Users,
  Video,
  FileCheck2,
  TrendingUp,
  PlusCircle,
  Copy,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  FolderOpen,
  Settings,
  UserPlus,
  Briefcase,
} from 'lucide-react';
import DailyScheduleView from '@/components/schedule/DailyScheduleView';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    coursesCount: 0,
    batchesCount: 0,
    usersCount: 0,
    liveClassesCount: 0,
    admissionsCount: 0,
    jobsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const [coursesRes, batchesRes, usersRes, liveRes, enrollRes, jobsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/batches'),
        api.get('/users').catch(() => ({ data: { count: 1 } })),
        api.get('/live-classes').catch(() => ({ data: { count: 0 } })),
        api.get('/enrollments/admin-list?limit=1').catch(() => ({ data: { total: 0 } })),
        api.get('/admin/jobs?limit=1').catch(() => ({ data: { total: 0 } })),
      ]);

      setStats({
        coursesCount: coursesRes.data.count || coursesRes.data.data?.length || 0,
        batchesCount: batchesRes.data.count || batchesRes.data.data?.length || 0,
        usersCount: usersRes.data.count || usersRes.data.data?.length || 1,
        liveClassesCount: liveRes.data.count || liveRes.data.data?.length || 0,
        admissionsCount: enrollRes.data.total || 0,
        jobsCount: jobsRes.data.total || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Modern Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage courses, batches, students, and live classes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/classes"
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Classes
            </Link>
            <Link
              href="/admin/courses"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" /> Courses
            </Link>
            <Link
              href="/admin/batches"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Batches
            </Link>
          </div>
        </div>

        {/* Sleek Minimalist Metric Cards with Watermark Background Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 sm:gap-6 mb-10">
          
          {/* Card 0: Manual Admission */}
          <Link
            href="/admin/admissions"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            <UserPlus className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:text-white/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                  ভর্তি ও শিক্ষার্থী যোগ
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 group-hover:bg-white group-hover:text-blue-700 transition-colors">
                  <UserPlus className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {stats.admissionsCount}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100 mt-3 pt-3 border-t border-white/20">
                  <span>নতুন ভর্তি করান</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
          
          {/* Card 1: Courses */}
          <Link
            href="/admin/courses"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            {/* Elegant Large Watermark Background Icon */}
            <BookOpen className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:text-white/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-cyan-100 uppercase tracking-wider">
                  Total Courses
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 group-hover:bg-white group-hover:text-cyan-700 transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {stats.coursesCount}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-100 mt-3 pt-3 border-t border-white/20">
                  <span>Manage Courses</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Card 2: Batches */}
          <Link
            href="/admin/batches"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            {/* Elegant Large Watermark Background Icon */}
            <Layers className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:text-white/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">
                  Total Batches
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 group-hover:bg-white group-hover:text-indigo-700 transition-colors">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {stats.batchesCount}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-100 mt-3 pt-3 border-t border-white/20">
                  <span>Manage & Duplicate</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Card 3: Free Classes & Seminars */}
          <Link
            href="/free-classes"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            {/* Elegant Large Watermark Background Icon */}
            <Video className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:text-white/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                  ফ্রি ক্লাস ও সেমিনার
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 group-hover:bg-white group-hover:text-emerald-700 transition-colors">
                  <Video className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {stats.liveClassesCount}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-100 mt-3 pt-3 border-t border-white/20">
                  <span>ফ্রি ক্লাস পরিচালনা করুন</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Card 4: Job Circulars Management */}
          <Link
            href="/admin/jobs"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            {/* Elegant Large Watermark Background Icon */}
            <Briefcase className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:text-white/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                  জব সার্কুলার
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 group-hover:bg-white group-hover:text-amber-700 transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {stats.jobsCount}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-100 mt-3 pt-3 border-t border-white/20">
                  <span>জব পোস্ট ম্যানেজ করুন</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Card 5: Other Settings */}
          <Link
            href="/admin/settings"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-pink-700 text-white p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            {/* Elegant Large Watermark Background Icon */}
            <Settings className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:text-white/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-purple-100 uppercase tracking-wider">
                  অন্যান্য সেটিংস
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 group-hover:bg-white group-hover:text-purple-700 transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  4
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-100 mt-3 pt-3 border-t border-white/20">
                  <span>কন্ট্রোল ও সেটিংস মডিউল</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Global Daily & Weekly Class Schedule Overview */}
        <DailyScheduleView
          role="admin"
          title="অ্যাকাডেমির দৈনিক ও সাপ্তাহিক ক্লাস মনিটরিং"
          subtitle="আজকে কোন কোন সময়ে কোন ব্যাচের ক্লাস রয়েছে এবং পুরো সপ্তাহের লাইভ ক্লাসের সূচী এক নজরে দেখুন"
        />

      </div>
    </div>
  );
}

