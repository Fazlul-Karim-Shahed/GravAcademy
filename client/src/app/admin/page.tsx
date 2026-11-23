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
  Inbox,
  CalendarCheck,
} from 'lucide-react';
import DailyScheduleView from '@/components/schedule/DailyScheduleView';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

type StatKey = 'coursesCount' | 'batchesCount' | 'usersCount' | 'liveClassesCount' | 'admissionsCount' | 'jobsCount' | 'financeTotal' | 'pendingRequestsCount';

const INITIAL_STAT_LOADING: Record<StatKey, boolean> = {
  coursesCount: true, batchesCount: true, usersCount: true, liveClassesCount: true,
  admissionsCount: true, jobsCount: true, financeTotal: true, pendingRequestsCount: true,
};

function DashboardStatValue({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (!loading) return <>{children}</>;
  return (
    <span aria-label="লোড হচ্ছে" className="relative inline-block h-7 min-w-16 overflow-hidden rounded-lg bg-slate-200/90 align-middle shadow-inner dark:bg-slate-700/70 sm:h-8">
      <span className="animate-card-sheen absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-90 dark:via-slate-300/30" />
    </span>
  );
}

function DashboardCardLoadingOverlay({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <span aria-label="তথ্য লোড হচ্ছে" className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl bg-white/55 backdrop-blur-[1.5px] dark:bg-slate-950/45">
      <span className="animate-card-sheen absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-slate-300/30" />
      <span className="absolute inset-x-4 bottom-4 h-2 rounded-full bg-slate-200/90 dark:bg-slate-700/70" />
    </span>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { isFeatureEnabled } = useSiteSettings();
  const [stats, setStats] = useState({
    coursesCount: 0,
    batchesCount: 0,
    usersCount: 0,
    liveClassesCount: 0,
    admissionsCount: 0,
    jobsCount: 0,
    financeTotal: 0,
    pendingRequestsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState<Record<StatKey, boolean>>(INITIAL_STAT_LOADING);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoadingStats(INITIAL_STAT_LOADING);
    const loadStat = (key: StatKey, request: Promise<any>, value: (response: any) => number) => {
      void request.then((response) => {
        setStats((previous) => ({ ...previous, [key]: value(response) }));
      }).catch((error) => {
        console.error(`Failed to load dashboard ${key}`, error);
        setStats((previous) => ({ ...previous, [key]: 0 }));
      }).finally(() => {
        setLoadingStats((previous) => ({ ...previous, [key]: false }));
      });
    };

    loadStat('coursesCount', api.get('/courses'), (r) => r.data.count || r.data.data?.length || 0);
    loadStat('batchesCount', api.get('/batches'), (r) => r.data.count || r.data.data?.length || 0);
    loadStat('usersCount', api.get('/users'), (r) => r.data.count || r.data.data?.length || 0);
    loadStat('liveClassesCount', api.get('/live-classes'), (r) => r.data.count || r.data.data?.length || 0);
    loadStat('admissionsCount', api.get('/enrollments/admin-list?limit=1'), (r) => r.data.total || 0);
    loadStat('jobsCount', api.get('/admin/jobs?limit=1'), (r) => r.data.total || 0);
    loadStat('financeTotal', api.get('/finance/admin-payments?limit=1'), (r) => r.data.summary?.totalRevenue || 0);
    loadStat('pendingRequestsCount', api.get('/enrollment-requests/admin?status=pending'), (r) => r.data.count || r.data.data?.length || 0);
  };

  return (
    <div className="ga-page ga-admin-page py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Modern Clean Header */}
        <header className="mb-8 grid gap-5 border-b border-slate-200/80 pb-6 dark:border-[#262b34] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {user?.role === 'superadmin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Link
              href="/admin/classes"
              style={{ display: isFeatureEnabled('courses', user?.role === 'superadmin') ? undefined : 'none' }}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-sm shadow-orange-950/20 flex items-center justify-center gap-2 transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Classes
            </Link>
            <Link
              href="/admin/courses"
              style={{ display: isFeatureEnabled('courses', user?.role === 'superadmin') ? undefined : 'none' }}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-sm shadow-orange-950/20 flex items-center justify-center gap-2 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" /> Courses
            </Link>
            <Link
              href="/admin/batches"
              style={{ display: isFeatureEnabled('batches', user?.role === 'superadmin') ? undefined : 'none' }}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-[#111318] hover:bg-slate-100 dark:hover:bg-[#151921] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-[#262b34] flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> Batches
            </Link>
          </div>
        </header>

        {/* Sleek Boxy Metric Cards with Watermark Background Icons */}
        <div className="admin-command-grid mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {/* Row 1: 6 Core Modules */}
          <div className="contents">
            {hasPermission(user, PERMISSIONS.ATTENDANCE_MANAGE) && (
              <Link
                href="/admin/attendance"
                className="ga-card group relative flex min-h-[136px] flex-col justify-between overflow-hidden p-4 transition-all duration-300 hover:border-orange-500/60 hover:shadow-lg sm:p-5"
              >
                <CalendarCheck className="pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 text-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:text-orange-500/10 dark:text-slate-800/40 dark:group-hover:text-orange-500/15" />
                <div className="relative z-10 mb-3 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white dark:border-orange-900/50 dark:bg-orange-950/60 dark:text-orange-400">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
                </div>
                <div className="relative z-10">
                  <div className="text-base font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">Attendance</div>
                  <div className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-400">শিক্ষক হাজিরা</div>
                </div>
              </Link>
            )}
            <Link
              href="/admin/admission-requests"
              style={{ display: isFeatureEnabled('admissions', user?.role === 'superadmin') ? undefined : 'none' }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Inbox className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors"><Inbox className="w-4 h-4" /></div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="relative z-10"><div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-none mb-1.5"><DashboardStatValue loading={loadingStats.pendingRequestsCount}>{stats.pendingRequestsCount}</DashboardStatValue></div><div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">ভর্তি Requests</div></div>
              <DashboardCardLoadingOverlay loading={loadingStats.pendingRequestsCount} />
            </Link>
            
            {/* Card 0: এডমিশন */}
            <Link
              href="/admin/admissions"
              style={{ display: isFeatureEnabled('admissions', user?.role === 'superadmin') ? undefined : 'none' }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <UserPlus className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <UserPlus className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  <DashboardStatValue loading={loadingStats.admissionsCount}>{stats.admissionsCount}</DashboardStatValue>
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                  এডমিশন
                </div>
              </div>
              <DashboardCardLoadingOverlay loading={loadingStats.admissionsCount} />
            </Link>
            
            {/* Card 1: কোর্স ম্যানেজমেন্ট */}
            <Link
              href="/admin/courses"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <BookOpen className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  <DashboardStatValue loading={loadingStats.coursesCount}>{stats.coursesCount}</DashboardStatValue>
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                  কোর্স ম্যানেজমেন্ট
                </div>
              </div>
              <DashboardCardLoadingOverlay loading={loadingStats.coursesCount} />
            </Link>

            {/* Card 2: ব্যাচ ম্যানেজমেন্ট */}
            <Link
              href="/admin/batches"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Layers className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  <DashboardStatValue loading={loadingStats.batchesCount}>{stats.batchesCount}</DashboardStatValue>
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                  ব্যাচ ম্যানেজমেন্ট
                </div>
              </div>
              <DashboardCardLoadingOverlay loading={loadingStats.batchesCount} />
            </Link>

            {/* Card 3: ফ্রি ক্লাস ও সেমিনার */}
            <Link
              href="/free-classes"
              style={{ display: isFeatureEnabled('freeClasses', user?.role === 'superadmin') ? undefined : 'none' }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Video className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Video className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  <DashboardStatValue loading={loadingStats.liveClassesCount}>{stats.liveClassesCount}</DashboardStatValue>
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                  ফ্রি ক্লাস ও সেমিনার
                </div>
              </div>
              <DashboardCardLoadingOverlay loading={loadingStats.liveClassesCount} />
            </Link>

            {/* Card 4: জব সার্কুলার */}
            <Link
              href="/admin/jobs"
              style={{ display: isFeatureEnabled('jobs', user?.role === 'superadmin') ? undefined : 'none' }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Briefcase className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Briefcase className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  <DashboardStatValue loading={loadingStats.jobsCount}>{stats.jobsCount}</DashboardStatValue>
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                  জব সার্কুলার
                </div>
              </div>
              <DashboardCardLoadingOverlay loading={loadingStats.jobsCount} />
            </Link>

          </div>

          {/* Row 2: Additional Management Modules (Starting with User Management) */}
          <div className="contents">

            {/* Settings shortcut */}
            <Link
              href="/admin/settings"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Settings className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors"><Settings className="w-4 h-4" /></div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="relative z-10"><div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">3</div><div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">অন্যান্য সেটিংস</div></div>
            </Link>
            
            {/* Card 6: ইউজার ম্যানেজমেন্ট */}
            <Link
              href="/admin/users"
              style={{ display: isFeatureEnabled('userManagement', user?.role === 'superadmin') ? undefined : 'none' }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <Users className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  <DashboardStatValue loading={loadingStats.usersCount}>{stats.usersCount}</DashboardStatValue>
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                  ইউজার ম্যানেজমেন্ট
                </div>
              </div>
              <DashboardCardLoadingOverlay loading={loadingStats.usersCount} />
            </Link>

            {/* Card 7: ফাইন্যান্স ম্যানেজমেন্ট (Finance Management) */}
            <Link
              href="/admin/finance"
              style={{ display: isFeatureEnabled('finance', user?.role === 'superadmin') ? undefined : 'none' }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <DollarSign className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <DollarSign className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                  <DashboardStatValue loading={loadingStats.financeTotal}>৳{stats.financeTotal.toLocaleString('bn-BD')}</DashboardStatValue>
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                  ফাইন্যান্স ম্যানেজমেন্ট
                </div>
              </div>
              <DashboardCardLoadingOverlay loading={loadingStats.financeTotal} />
            </Link>

            {/* Card 8: Audit Log — superadmin only, same as the backend route */}
            {user?.role === 'superadmin' && (
              <Link
                href="/admin/audit-logs"
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all duration-300 flex flex-col justify-between"
              >
                <ShieldCheck className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 dark:group-hover:text-orange-500/15 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="relative z-10">
                  <div className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-1.5">
                    অডিট লগ
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                    সব সেনসিটিভ অ্যাকশনের রেকর্ড
                  </div>
                </div>
              </Link>
            )}

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

