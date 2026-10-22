'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Button } from '@/components/ui';
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Info,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';

interface CourseItem {
  _id: string;
  title: string;
  gradeLevel?: string;
  subject?: string;
}

export default function CreateBatchPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClassItem[]>([]);
  const [existingBatches, setExistingBatches] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Hierarchical Filter State
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  const [form, setForm] = useState({
    name: '',
    courseId: '',
    status: 'draft',
    fee: 0,
    scheduleText: '',
    capacity: 40,
    copyFromBatchId: '',
  });

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    setLoading(true);
    try {
      const [coursesRes, batchesRes, classList] = await Promise.all([
        api.get('/courses'),
        api.get('/batches'),
        getSharedAcademicClasses(),
      ]);
      if (coursesRes.data?.success) {
        const loadedCourses: CourseItem[] = coursesRes.data.data;
        setCourses(loadedCourses);
        if (loadedCourses.length > 0) {
          setForm((prev) => ({ ...prev, courseId: loadedCourses[0]._id }));
        }
      }
      setAcademicClasses(classList);
      if (batchesRes.data?.success) {
        setExistingBatches(batchesRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load courses or batches:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute available classes from classes list or courses
  const availableClasses = academicClasses.length > 0
    ? academicClasses.map((ac) => ac.name)
    : Array.from(new Set(courses.map((c) => c.gradeLevel).filter(Boolean))) as string[];

  // Filtered courses based strictly on Class
  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      return selectedClass === 'All' || (c.gradeLevel || '').toLowerCase() === selectedClass.toLowerCase();
    });
  }, [courses, selectedClass]);

  // When filtered courses change, ensure form.courseId is valid
  useEffect(() => {
    if (filteredCourses.length > 0) {
      const exists = filteredCourses.some((c) => c._id === form.courseId);
      if (!exists) {
        setForm((prev) => ({ ...prev, courseId: filteredCourses[0]._id }));
      }
    } else {
      setForm((prev) => ({ ...prev, courseId: '' }));
    }
  }, [filteredCourses]);

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

      if (form.copyFromBatchId) {
        payload.copyFromBatchId = form.copyFromBatchId;
      }

      const res = await api.post('/batches', payload);
      if (res.data?.success) {
        setSuccess(
          form.copyFromBatchId
            ? 'Batch created with cloned content hierarchy successfully! Redirecting...'
            : 'Batch created successfully! Redirecting...'
        );
        setTimeout(() => {
          router.push('/admin/batches');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create batch. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/admin/batches"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Batch Management
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" /> Batch Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create New Batch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Establish a distinct classroom roster, live schedule, and syllabus hierarchy for student enrollments.
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

        {/* Dedicated Form */}
        <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Batch Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Batch Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 2026 Morning Batch Alpha"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            {/* Academic Hierarchy Selection: Class -> Course */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  ১. শ্রেণি ও কোর্স নির্বাচন (Class &rarr; Course)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Class / Grade */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    শ্রেণি / Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="All">All Classes (সব শ্রেণি)</option>
                    {availableClasses.map((ac) => (
                      <option key={ac} value={ac}>
                        {ac}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Course */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    কোর্স / Target Course *
                  </label>
                  <select
                    required
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">কোর্স নির্বাচন করুন ({filteredCourses.length})</option>
                    {filteredCourses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} {c.gradeLevel ? `(${c.gradeLevel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredCourses.length === 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  নির্বাচিত শ্রেণির অধীনস্থ কোনো কোর্স পাওয়া যায়নি। অনুগ্রহ করে অন্য শ্রেণি নির্বাচন করুন অথবা নতুন কোর্স তৈরি করুন।
                </p>
              )}
            </div>

            {/* Enrollment Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Enrollment Status *
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="draft">Draft (Private setup)</option>
                <option value="active">Active (Open for Admissions)</option>
                <option value="completed">Completed (Archived)</option>
              </select>
            </div>

            {/* Fee, Schedule & Capacity */}
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">০ হলে ফ্রি ব্যাচ হিসেবে গণ্য হবে</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Weekly Class Schedule Text
                </label>
                <input
                  type="text"
                  value={form.scheduleText}
                  onChange={(e) => setForm({ ...form, scheduleText: e.target.value })}
                  placeholder="e.g. Mon, Wed, Fri 7:00 PM"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Zero-Coupling Clone Feature */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40">
              <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                <Copy className="w-4 h-4" />
                <span>Zero-Coupling Batch Curriculum Duplication</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                Optionally copy all modules, sections, and lesson notes from an existing batch into this new batch. 
                The cloned hierarchy is independently isolated—edits made here won&apos;t change the source batch.
              </p>
              <select
                value={form.copyFromBatchId}
                onChange={(e) => setForm({ ...form, copyFromBatchId: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Start with blank / fresh syllabus (No cloning)</option>
                {existingBatches.map((b) => (
                  <option key={b._id} value={b._id}>
                    Clone from: {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3">
              <Link href="/admin/batches">
                <Button type="button" variant="secondary" size="md">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={submitting} size="md">
                Save & Create Batch
              </Button>
            </div>

          </form>
        </Card>

      </div>
    </div>
  );
}
