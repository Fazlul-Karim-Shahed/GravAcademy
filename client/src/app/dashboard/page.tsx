'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Video,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-8 mb-8 border border-slate-800 relative overflow-hidden bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-slate-900/60">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Student Learning Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Track your coaching progress, watch recorded YouTube lectures, access Google Drive lecture notes, and take scheduled examinations.
          </p>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Enrolled Batches
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">2 Active</div>
          <span className="text-xs text-slate-500 mt-1 block">Class 10 Physics & Math</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed Lessons
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">14 / 28</div>
          <span className="text-xs text-emerald-400 mt-1 block">50% overall progress</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Upcoming Exams
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">1 Scheduled</div>
          <span className="text-xs text-purple-400 mt-1 block">Physics Chapter 3 MCQ</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Next Live Class
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">Tomorrow</div>
          <span className="text-xs text-amber-400 mt-1 block">Google Meet • 7:30 PM</span>
        </Card>
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" /> Continue Learning
            </h2>
            <Link href="/courses" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              Browse All Courses →
            </Link>
          </div>

          <Card className="border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Class 10 Physics
                </span>
                <h3 className="text-lg font-bold text-white mt-2">
                  Module 2: Newton&apos;s Laws of Motion
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Lesson 3: Conservation of Linear Momentum & Friction
                </p>
              </div>

              <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-colors shrink-0">
                <Video className="w-4 h-4" /> Resume Lecture
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Attached Documents: 2 PDFs (Google Drive synced)</span>
              <span>Duration: 42 mins</span>
            </div>
          </Card>
        </div>

        {/* Live Classes & Notices */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> Live Schedule
          </h2>

          <Card className="border border-slate-800">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-indigo-400 font-semibold">Google Meet Session</span>
                <span className="text-slate-500">7:30 PM BST</span>
              </div>
              <h4 className="text-sm font-bold text-white">Math Problem Solving & Doubts</h4>
              <p className="text-xs text-slate-400 mt-1">Instructor: Farhan Sir</p>
            </div>

            <button className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all">
              Join Live Meeting
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
