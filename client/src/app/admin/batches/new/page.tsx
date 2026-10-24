'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
import WeeklyScheduleBuilder from '@/components/schedule/WeeklyScheduleBuilder';
import { ScheduleSlot, formatScheduleSlots } from '@/lib/schedule';

interface CourseItem {
  _id: string;
  title: string;
  gradeLevel?: string;
  subject?: string;
}

function CreateBatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneFromId = searchParams.get('cloneFrom') || '';

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
    weeklySchedule: [] as ScheduleSlot[],
    capacity: 40,
    meetingUrl: '',
    copyFromBatchId: cloneFromId,
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
          setForm((prev) => ({ ...prev, courseId: prev.courseId || loadedCourses[0]._id }));
        }
      }
      setAcademicClasses(classList);
      if (batchesRes.data?.success) {
        const list = batchesRes.data.data;
        setExistingBatches(list);

        // If cloneFromId is given, pre-fill form from source batch
        if (cloneFromId) {
          const source = list.find((b: any) => b._id === cloneFromId);
          if (source) {
            const cId = typeof source.courseId === 'object' && source.courseId !== null ? source.courseId._id : source.courseId;
            const cGrade = typeof source.courseId === 'object' && source.courseId !== null ? source.courseId.gradeLevel : '';
            if (cGrade) setSelectedClass(cGrade);

            setForm({
              name: `${source.name} (Copy)`,
              courseId: cId || '',
              status: 'draft',
              fee: source.fee || 0,
              scheduleText: source.scheduleText || '',
              weeklySchedule: Array.isArray(source.weeklySchedule) ? source.weeklySchedule : [],
              capacity: source.capacity || 40,
              meetingUrl: source.meetingUrl || '',
              copyFromBatchId: cloneFromId,
            });
          }
        }
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
      // Auto compute schedule text if empty but slots provided
      const finalScheduleText = form.scheduleText.trim()
        ? form.scheduleText.trim()
        : formatScheduleSlots(form.weeklySchedule);

      const payload: any = {
        name: form.name,
        courseId: form.courseId,
        status: form.status,
        fee: Number(form.fee) || 0,
        scheduleText: finalScheduleText,
        weeklySchedule: form.weeklySchedule,
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
            {cloneFromId ? <Copy className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
            {cloneFromId ? 'Batch Cloning & Duplication' : 'Batch Configuration'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {cloneFromId ? 'Duplicate & Create New Batch' : 'Create New Batch'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {cloneFromId
              ? 'Clone the full curriculum, structure, and configuration from the selected batch into a new dedicated batch.'
              : 'Establish a distinct classroom roster, live schedule, and syllabus hierarchy for student enrollments.'}
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

            {/* Schedule & Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Student Seat Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={form.capacity === 0 ? '' : form.capacity}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setForm({ ...form, capacity: raw === '' ? 0 : Number(raw) });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-1">ব্যাচে সর্বোচ্চ কতজন শিক্ষার্থী ভর্তি হতে পারবে</span>
              </div>
            </div>

            {/* Structured Weekly Class Schedule Builder */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <WeeklyScheduleBuilder
                slots={form.weeklySchedule}
                onChange={(newSlots) => {
                  setForm((prev) => ({
                    ...prev,
                    weeklySchedule: newSlots,
                    scheduleText: formatScheduleSlots(newSlots),
                  }));
                }}
              />

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Generated / Custom Schedule Summary Text
                </label>
                <input
                  type="text"
                  value={form.scheduleText}
                  onChange={(e) => setForm({ ...form, scheduleText: e.target.value })}
                  placeholder="e.g. শনি (19:00 - 20:30), রবি (20:00 - 21:30)"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Google Meet Classroom Link */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  গুগল মিট ক্লাসরুম লিংক (Google Meet URL)
                </label>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                  অটো-জেনারেটেড
                </span>
              </div>
              <input
                type="url"
                value={form.meetingUrl}
                onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                placeholder="খালি রাখলে সিস্টেম স্বয়ংক্রিয়ভাবে একটি Google Meet লিংক তৈরি করে দেবে"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                এই ব্যাচের সকল ক্লাসের জন্য শিক্ষার্থীরা তাদের লার্নিং ড্যাশবোর্ড ও দৈনিক রুটিন থেকে সরাসরি এই গুগল মিট লিংকে প্রবেশ করে ক্লাসে যোগ দিতে পারবে।
              </p>
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

export default function CreateBatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 sm:p-10 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ব্যাচ ফর্ম লোড হচ্ছে...</p>
          </div>
        </div>
      }
    >
      <CreateBatchContent />
    </Suspense>
  );
}

