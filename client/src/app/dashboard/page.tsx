'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();

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
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Track your coaching progress, watch recorded YouTube lectures, access Google Drive lecture notes, and take scheduled examinations.
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          {/* Metric 1 */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Enrolled Batches
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">2 Active</div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Class 10 Physics & Math</span>
          </div>

          {/* Metric 2 */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Completed Lessons
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">14 / 28</div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">50% overall progress</span>
          </div>

          {/* Metric 3 */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Upcoming Exams
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">1 Scheduled</div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1 block">Physics Chapter 3 MCQ</span>
          </div>

          {/* Metric 4 */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Next Live Class
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Tomorrow</div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 block">Google Meet • 7:30 PM</span>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Continue Learning */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Continue Learning
              </h2>
              <Link href="/courses" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold">
                Browse All Courses →
              </Link>
            </div>

            <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 inline-block">
                    Class 10 Physics
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    Module 2: Newton&apos;s Laws of Motion
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Lesson 3: Conservation of Linear Momentum & Friction
                  </p>
                </div>

                <Link
                  href="/learn/6ad8a5a0c24d56e3d29b3533"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors shrink-0"
                >
                  <PlayCircle className="w-4 h-4" /> Resume Lecture
                </Link>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" /> Attached Documents: 2 PDFs (Google Drive synced)
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration: 42 mins
                </span>
              </div>
            </div>
          </div>

          {/* Live Classes & Notices */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Live Schedule
            </h2>

            <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">Google Meet Session</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">7:30 PM BST</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Math Problem Solving & Doubts</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Instructor: Farhan Sir</p>
              </div>

              <a
                href="https://meet.google.com"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Video className="w-3.5 h-3.5" /> Join Live Meeting
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
