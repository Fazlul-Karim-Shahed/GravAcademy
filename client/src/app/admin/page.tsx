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
  DollarSign,
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/classes"
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Classes
            </Link>
            <Link
              href="/admin/courses"
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" /> Courses
            </Link>
            <Link
              href="/admin/batches"
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Batches
            </Link>
          </div>
        </div>

        {/* Sleek Boxy Metric Cards with Watermark Background Icons */}
        <div className="space-y-4 mb-10">
          {/* Row 1: 6 Core Modules */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            
            {/* Card 0: এডমিশন */}
            <Link
              href="/admin/admissions"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-blue-400/80 dark:hover:border-blue-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <UserPlus className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-blue-500/10 dark:group-hover:text-blue-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UserPlus className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  {stats.admissionsCount}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  এডমিশন
                </div>
              </div>
            </Link>
            
            {/* Card 1: কোর্স ম্যানেজমেন্ট */}
            <Link
              href="/admin/courses"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-blue-400/80 dark:hover:border-blue-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <BookOpen className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-blue-500/10 dark:group-hover:text-blue-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  {stats.coursesCount}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  কোর্স ম্যানেজমেন্ট
                </div>
              </div>
            </Link>

            {/* Card 2: ব্যাচ ম্যানেজমেন্ট */}
            <Link
              href="/admin/batches"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-indigo-400/80 dark:hover:border-indigo-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Layers className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-indigo-500/10 dark:group-hover:text-indigo-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  {stats.batchesCount}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  ব্যাচ ম্যানেজমেন্ট
                </div>
              </div>
            </Link>

            {/* Card 3: ফ্রি ক্লাস ও সেমিনার */}
            <Link
              href="/free-classes"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-emerald-400/80 dark:hover:border-emerald-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Video className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-emerald-500/10 dark:group-hover:text-emerald-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Video className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  {stats.liveClassesCount}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  ফ্রি ক্লাস ও সেমিনার
                </div>
              </div>
            </Link>

            {/* Card 4: জব সার্কুলার */}
            <Link
              href="/admin/jobs"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-amber-400/80 dark:hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Briefcase className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-amber-500/10 dark:group-hover:text-amber-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Briefcase className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  {stats.jobsCount}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  জব সার্কুলার
                </div>
              </div>
            </Link>

            {/* Card 5: অন্যান্য সেটিংস */}
            <Link
              href="/admin/settings"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-purple-400/80 dark:hover:border-purple-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Settings className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-purple-500/10 dark:group-hover:text-purple-500/15 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  3
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  অন্যান্য সেটিংস
                </div>
              </div>
            </Link>
          </div>

          {/* Row 2: Additional Management Modules (Starting with User Management) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            
            {/* Card 6: ইউজার ম্যানেজমেন্ট */}
            <Link
              href="/admin/users"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-cyan-400/80 dark:hover:border-cyan-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Users className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-cyan-500/10 dark:group-hover:text-cyan-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-100 dark:border-cyan-900/50 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  {stats.usersCount}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  ইউজার ম্যানেজমেন্ট
                </div>
              </div>
            </Link>

            {/* Card 7: ফাইন্যান্স ম্যানেজমেন্ট (Finance Management) */}
            <Link
              href="/admin/finance"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-emerald-400/80 dark:hover:border-emerald-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <DollarSign className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-emerald-500/10 dark:group-hover:text-emerald-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <DollarSign className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  ৳০
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  ফাইন্যান্স ম্যানেজমেন্ট
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* Global Daily & Weekly Class Schedule Overview */}
        <DailyScheduleView
          role="admin"
          title="দৈনিক ও সাপ্তাহিক ক্লাস মনিটরিং"
        />

      </div>
    </div>
  );
}

