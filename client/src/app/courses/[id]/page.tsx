'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  BookOpen,
  GraduationCap,
  Layers,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface Batch {
  _id: string;
  name: string;
  status: string;
  scheduleText?: string;
  capacity?: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  gradeLevel: string;
  subject: string;
  courseFee: number;
  duration?: string;
}

export const dynamic = 'force-dynamic';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseAndBatches();
  }, [resolvedParams.id]);

  const fetchCourseAndBatches = async () => {
    setLoading(true);
    try {
      const [cRes, bRes] = await Promise.all([
        api.get(`/courses/${resolvedParams.id}`),
        api.get('/batches', { params: { courseId: resolvedParams.id } }),
      ]);
      if (cRes.data?.success) setCourse(cRes.data.data);
      if (bRes.data?.success) setBatches(bRes.data.data);
    } catch (err) {
      console.error('Error fetching course data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
            <div className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 text-center">
        <div className="max-w-md mx-auto px-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course not found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            The course you are looking for may have been archived or removed.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">
          <Link
            href="/courses"
            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200 font-semibold">{course.title}</span>
        </div>

        {/* Fresh Course Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-10 shadow-xs">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
                {course.gradeLevel}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {course.subject}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {course.title}
            </h1>

            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {course.description || 'Comprehensive interactive syllabus with structured chapters, lecture notes, video archives, and practice exams.'}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Duration</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{course.duration || 'Flexible'}</span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Course Fee</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                  {course.courseFee === 0 ? 'Free' : `৳ ${course.courseFee.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Batches Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Available Batches & Cohorts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select an active batch cohort to enter the learning room and access live syllabus content.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            {batches.length} {batches.length === 1 ? 'Cohort' : 'Cohorts'} Found
          </span>
        </div>

        {/* Batches Grid */}
        {batches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center py-14 px-4 shadow-xs">
            <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No active cohorts yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Administrators have not yet scheduled a batch cohort for this course. Please check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <div
                key={batch._id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                      {batch.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Max {batch.capacity || 40}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                    {batch.name}
                  </h3>

                  {batch.scheduleText ? (
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-6">
                      <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{batch.scheduleText}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic mb-6">No specific schedule posted yet.</div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/learn/${batch._id}`}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Enter Learning Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
