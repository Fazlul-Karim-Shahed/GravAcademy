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
  Edit
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    coursesCount: 0,
    batchesCount: 0,
    usersCount: 0,
    liveClassesCount: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [recentBatches, setRecentBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const [coursesRes, batchesRes, usersRes, liveRes] = await Promise.all([
        api.get('/courses'),
        api.get('/batches'),
        api.get('/users').catch(() => ({ data: { count: 1 } })),
        api.get('/live-classes').catch(() => ({ data: { count: 0 } })),
      ]);

      setStats({
        coursesCount: coursesRes.data.count || coursesRes.data.data?.length || 0,
        batchesCount: batchesRes.data.count || batchesRes.data.data?.length || 0,
        usersCount: usersRes.data.count || usersRes.data.data?.length || 1,
        liveClassesCount: liveRes.data.count || liveRes.data.data?.length || 0,
      });

      if (coursesRes.data.success) setRecentCourses(coursesRes.data.data.slice(0, 4));
      if (batchesRes.data.success) setRecentBatches(batchesRes.data.data.slice(0, 4));
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

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          
          {/* Card 1: Courses */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Courses
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.coursesCount}</div>
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-3 font-semibold transition-colors"
            >
              <span>Manage Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Batches */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Batches
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.batchesCount}</div>
            <Link
              href="/admin/batches"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-3 font-semibold transition-colors"
            >
              <span>Manage & Duplicate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Users */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Registered Users
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.usersCount}</div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mt-3 font-semibold transition-colors"
            >
              <span>Roles & Permissions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Live Classes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Live Classes
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.liveClassesCount}</div>
            <Link
              href="/live-classes"
              className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-3 font-semibold transition-colors"
            >
              <span>Schedule Sessions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Grid: Courses Overview & Active Batches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Active Curricula Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Active Curricula
              </h3>
              <Link
                href="/admin/courses"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All ({stats.coursesCount})
              </Link>
            </div>

            <div className="space-y-3">
              {recentCourses.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No active courses found.</p>
              ) : (
                recentCourses.map((c) => (
                  <div
                    key={c._id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/50">
                        {c.gradeLevel}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5">{c.title}</h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Subject: {c.subject}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/courses/${c._id}/edit`}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                        title="Edit Full Course Details"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/courses/${c._id}`}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                        title="View Public Course Page"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Batches Quick Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Active Batches & Syllabus
              </h3>
              <Link
                href="/admin/batches"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View All ({stats.batchesCount})
              </Link>
            </div>

            <div className="space-y-3">
              {recentBatches.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No active batches found.</p>
              ) : (
                recentBatches.map((b) => (
                  <div
                    key={b._id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                        {b.status}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5">{b.name}</h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {b.courseId?.title || 'General Batch'}
                      </span>
                    </div>

                    <Link
                      href={`/admin/batches/${b._id}/curriculum`}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/80 dark:border-blue-700/40 transition-colors flex items-center gap-1"
                    >
                      <span>Edit Lessons</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
