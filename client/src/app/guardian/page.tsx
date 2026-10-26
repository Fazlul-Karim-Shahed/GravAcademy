'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Award,
  Calendar,
  CheckCircle2,
  FileCheck2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function GuardianPortalPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Banner */}
        <div className="rounded-3xl p-8 mb-8 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900/60 shadow-xs">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Parent & Guardian Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Academic Progress Monitor
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Transparently monitor your child&apos;s attendance records, weekly examination scores, upcoming live schedules, and learning activity.
            </p>
          </div>
        </div>

        {/* Linked Student Card */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Linked Student Profile
          </h2>

          <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
                  TA
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tanvir Ahmed</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Class 10 (SSC 2026 Batch) • Roll #14</p>
                  <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-200/70 dark:border-emerald-500/20">
                    Status: Active Enrolled
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:text-right">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Attendance Rate</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">96.5%</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Average Test Score</span>
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400">88%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Exam Results */}
          <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Recent Examination Results
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Class 10 Physics Chapter 3 Test</h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Date: October 18, 2026</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">19 / 20</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Passed</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Class 6 Bangla Grammar Quiz</h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Date: October 12, 2026</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 block">17.5 / 20</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Passed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Schedules & Notices */}
          <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Upcoming Class Schedule
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">SSC Physics Live Problem Solving</h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tomorrow • 7:30 PM (Live Class)</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 text-xs font-bold">
                  Scheduled
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Bangla 1st Paper Literature Class</h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Friday • 6:00 PM</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 text-xs font-bold">
                  Scheduled
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
