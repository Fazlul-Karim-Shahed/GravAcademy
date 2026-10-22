'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Calendar,
  Users,
  DollarSign,
  Save,
} from 'lucide-react';
import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';

interface CourseItem {
  _id: string;
  title: string;
  gradeLevel?: string;
  subject?: string;
}

export default function EditBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params?.batchId as string;

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Class Filter
  const [selectedClass, setSelectedClass] = useState<string>('All');

  const [form, setForm] = useState({
    name: '',
    courseId: '',
    status: 'draft',
    fee: 0,
    scheduleText: '',
    capacity: 40,
  });

  useEffect(() => {
    if (batchId) {
      loadBatchAndPrerequisites();
    }
  }, [batchId]);

  const loadBatchAndPrerequisites = async () => {
    setLoading(true);
    try {
      const [batchRes, coursesRes, classList] = await Promise.all([
        api.get(`/batches/${batchId}`),
        api.get('/courses'),
        getSharedAcademicClasses(),
      ]);

      if (coursesRes.data?.success) {
        setCourses(coursesRes.data.data);
      }
      setAcademicClasses(classList);

      if (batchRes.data?.success) {
        const b = batchRes.data.data;
        const cId = typeof b.courseId === 'object' && b.courseId !== null ? b.courseId._id : (b.courseId || '');
        const cGrade = typeof b.courseId === 'object' && b.courseId !== null ? b.courseId.gradeLevel : '';

        if (cGrade) {
          setSelectedClass(cGrade);
        }

        setForm({
          name: b.name || '',
          courseId: cId,
          status: b.status || 'draft',
          fee: b.fee || 0,
          scheduleText: b.scheduleText || '',
          capacity: b.capacity || 40,
        });
      }
    } catch (err: any) {
      console.error('Failed to load batch details:', err);
      setError(err.response?.data?.message || 'Failed to load batch details.');
    } finally {
      setLoading(false);
    }
  };

  // Compute available classes
  const availableClasses = academicClasses.length > 0
    ? academicClasses.map((ac) => ac.name)
    : Array.from(new Set(courses.map((c) => c.gradeLevel).filter(Boolean))) as string[];

  // Filtered courses based on Class
  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      return selectedClass === 'All' || (c.gradeLevel || '').toLowerCase() === selectedClass.toLowerCase();
    });
  }, [courses, selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        name: form.name,
        courseId: form.courseId,
        status: form.status,
        fee: Number(form.fee) || 0,
        scheduleText: form.scheduleText,
        capacity: Number(form.capacity),
      };

      const res = await api.put(`/batches/${batchId}`, payload);
      if (res.data?.success) {
        setSuccess('✅ Batch details updated successfully! Redirecting...');
        setTimeout(() => {
          router.push('/admin/batches');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update batch. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="h-8 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mb-6" />
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/batches"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Batch Management
          </Link>

          <Link
            href={`/admin/batches/${batchId}/curriculum`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manage Curriculum</span>
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" /> Batch Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Edit Batch Details
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update batch title, class level, admission fee, live class schedules, and seat capacity.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Batch Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Batch Title *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Class 10 Physics - Special Final Revision Batch"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Class & Course Selection */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Class & Course Assignment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Class Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Academic Class Level
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="All">All Classes ({availableClasses.length})</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Course Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Parent Course *
                  </label>
                  <select
                    required
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select a Course ({filteredCourses.length})</option>
                    {filteredCourses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} {c.gradeLevel ? `(${c.gradeLevel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Enrollment Status *
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="draft">Draft (Private setup)</option>
                <option value="upcoming">Upcoming (Scheduled for launch)</option>
                <option value="active">Active (Open for Admissions)</option>
                <option value="completed">Completed (Archived)</option>
              </select>
            </div>

            {/* Fee, Schedule & Capacity 3-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Batch Fee (৳ BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">০ হলে ফ্রি ব্যাচ হিসেবে গণ্য হবে</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Weekly Class Schedule
                </label>
                <input
                  type="text"
                  value={form.scheduleText}
                  onChange={(e) => setForm({ ...form, scheduleText: e.target.value })}
                  placeholder="e.g. Mon, Wed, Fri 7:00 PM"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Student Seat Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/admin/batches"
                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Saving Changes...' : 'Save Batch Details'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
