'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';
import { FormPageHeader, FormSectionNav, FormSection } from '@/components/ui';
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Info,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Clock,
  Users,
} from 'lucide-react';

import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';
import WeeklyScheduleBuilder from '@/components/schedule/WeeklyScheduleBuilder';
import { ScheduleSlot, formatScheduleSlots } from '@/lib/schedule';

interface CourseItem {
  _id: string;
  title: string;
  gradeLevel?: string;
  subject?: string;
  durationMonths?: number;
}

const batchSections = [
  { id: 'basic', label: 'Basic info' },
  { id: 'timeline', label: 'Timeline & status' },
  { id: 'schedule', label: 'Class routine' },
  { id: 'clone', label: 'Curriculum clone' },
];

const todayInDhaka = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

function CreateBatchContent() {
  const router = useRouter();
  const { user } = useAuth();
  const canDuplicate = hasPermission(user, PERMISSIONS.BATCHES_DUPLICATE);
  const canCreate = hasPermission(user, PERMISSIONS.BATCHES_MANAGE);
  const batchesHref = usePathname().startsWith('/employee/') ? '/employee/batches' : '/admin/batches';
  const searchParams = useSearchParams();
  const cloneFromId = searchParams.get('cloneFrom') || '';

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClassItem[]>([]);
  const [existingBatches, setExistingBatches] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusTouched, setStatusTouched] = useState(false);

  // Hierarchical Filter State
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  const [form, setForm] = useState({
    name: '',
    courseId: '',
    status: 'draft',
    scheduleText: '',
    weeklySchedule: [] as ScheduleSlot[],
    capacity: 40,
    startDate: '',
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
            const cId =
              typeof source.courseId === 'object' && source.courseId !== null
                ? source.courseId._id
                : source.courseId;
            const cGrade =
              typeof source.courseId === 'object' && source.courseId !== null
                ? source.courseId.gradeLevel
                : '';
            if (cGrade) setSelectedClass(cGrade);

            setForm({
              name: `${source.name} (Copy)`,
              courseId: cId || '',
              status: 'draft',
              scheduleText: source.scheduleText || '',
              weeklySchedule: Array.isArray(source.weeklySchedule)
                ? source.weeklySchedule.map((s: any) => ({
                    ...s,
                    topic: s.topic?.trim() || 'Lecture Day',
                  }))
                : [],
              capacity: source.capacity || 40,
              startDate: '',
              meetingUrl: source.meetingUrl || '',
              copyFromBatchId: source._id,
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load prerequisites:', err);
      setError('কোর্স বা প্রয়োজনীয় ডেটা লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = academicClasses.map((item) => item.name);

  const filteredCourses = courses.filter((c) => {
    const matchClass = selectedClass === 'All' || c.gradeLevel === selectedClass;
    const matchSubject = selectedSubject === 'All' || c.subject === selectedSubject;
    return matchClass && matchSubject;
  });

  const availableSubjects = Array.from(
    new Set(
      courses
        .filter((c) => selectedClass === 'All' || c.gradeLevel === selectedClass)
        .map((c) => c.subject)
        .filter(Boolean)
    )
  ) as string[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((form.copyFromBatchId && !canDuplicate) || (!form.copyFromBatchId && !canCreate)) {
      setError('এই কাজের অনুমতি নেই।');
      return;
    }
    if (!form.name || !form.courseId) {
      setError('ব্যাচের নাম এবং কোর্স নির্বাচন করা আবশ্যক');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        name: form.name,
        courseId: form.courseId,
        status: form.status,
        scheduleText: form.scheduleText,
        weeklySchedule: form.weeklySchedule,
        capacity: Number(form.capacity) || 40,
        meetingUrl: form.meetingUrl,
      };

      if (form.startDate) {
        payload.startDate = form.startDate;
      }

      if (form.copyFromBatchId) {
        payload.copyFromBatchId = form.copyFromBatchId;
      }

      const res = await api.post('/batches', payload);
      if (res.data?.success) {
        setSuccess('ব্যাচ সফলভাবে তৈরি হয়েছে!');
        setTimeout(() => {
          router.push(batchesHref);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Failed to create batch:', err);
      setError(err.response?.data?.message || 'ব্যাচ তৈরি করতে ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-[#262b34] dark:bg-[#151921] dark:text-white';
  const labelClass = 'mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300';

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900 dark:bg-[#0b0d12] dark:text-white sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FormPageHeader
          backHref={batchesHref}
          backLabel="Batches"
          eyebrow={cloneFromId ? 'Batch duplication' : 'Batch configuration'}
          title={cloneFromId ? 'Duplicate & Create New Batch' : 'Create New Batch'}
          description="Course, schedule এবং enrollment settings এক জায়গা থেকে প্রস্তুত করুন।"
          badge={
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              {cloneFromId ? 'Duplicate batch' : 'New batch'}
            </span>
          }
        />

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid items-start gap-7 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <FormSectionNav heading="Batch sections" items={batchSections} />

          <div className="min-w-0 bg-transparent sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white dark:bg-transparent dark:sm:border-[#262b34] dark:sm:bg-[#111318]">
            {/* Section 1: Basic Info */}
            <FormSection
              id="basic"
              icon={<GraduationCap className="h-4 w-4" />}
              title="মৌলিক তথ্য ও কোর্স নির্ধারণ"
              description="ব্যাচের শিরোনাম এবং সংশ্লিষ্ট শ্রেণি ও কোর্স নির্বাচন করুন।"
            >
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    Batch Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. 2026 Morning Batch Alpha"
                    className={inputClass}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#262b34] dark:bg-[#151921]/40 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      শ্রেণি ও কোর্স নির্বাচন (Class &rarr; Course)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                        শ্রেণি / Class
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className={inputClass}
                      >
                        <option value="All">All Classes (সব শ্রেণি)</option>
                        {availableClasses.map((ac) => (
                          <option key={ac} value={ac}>
                            {ac}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                        কোর্স / Target Course <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={form.courseId}
                        onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                        className={inputClass}
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
                    <p className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      নির্বাচিত শ্রেণির অধীনস্থ কোনো কোর্স পাওয়া যায়নি। অনুগ্রহ করে অন্য শ্রেণি নির্বাচন করুন অথবা নতুন কোর্স তৈরি করুন।
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Section 2: Timeline & Status */}
            <FormSection
              id="timeline"
              icon={<CalendarDays className="h-4 w-4" />}
              title="সময়কাল ও স্ট্যাটাস"
              description="ব্যাচ শুরুর তারিখ, ভর্তি সংক্রান্ত স্ট্যাটাস ও সিট ক্যাপাসিটি নির্ধারণ করুন।"
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#262b34] dark:bg-[#151921]/40 sm:p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        শুরুর তারিখ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={form.startDate}
                        onChange={(e) => {
                          const startDate = e.target.value;
                          setForm((current) => ({
                            ...current,
                            startDate,
                            status:
                              !statusTouched && startDate
                                ? startDate > todayInDhaka()
                                  ? 'upcoming'
                                  : 'active'
                                : current.status,
                          }));
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div className="self-end pb-2.5 text-xs text-slate-500 dark:text-slate-400">
                      নির্বাচিত কোর্স মেয়াদ:{' '}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {courses.find((c) => c._id === form.courseId)?.durationMonths
                          ? `${courses.find((c) => c._id === form.courseId)?.durationMonths} মাস`
                          : 'মেয়াদ নির্ধারিত নেই'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Enrollment Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => {
                        setStatusTouched(true);
                        setForm({ ...form, status: e.target.value });
                      }}
                      className={inputClass}
                    >
                      <option value="draft">Draft (Private setup)</option>
                      <option value="upcoming">Upcoming (Scheduled for launch)</option>
                      <option value="active">Active (Open for Admissions)</option>
                      <option value="completed">Completed (Archived)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Student Seat Capacity</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={form.capacity === 0 ? '' : form.capacity}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setForm({ ...form, capacity: raw === '' ? 0 : Number(raw) });
                      }}
                      className={inputClass}
                      placeholder="e.g. 40"
                    />
                    <span className="mt-1 block text-[10px] text-slate-400">
                      ব্যাচে সর্বোচ্চ কতজন শিক্ষার্থী ভর্তি হতে পারবে
                    </span>
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Section 3: Schedule */}
            <FormSection
              id="schedule"
              icon={<Clock className="h-4 w-4" />}
              title="সাপ্তাহিক ক্লাস রুটিন"
              description="সপ্তাহের ক্লাস দিন এবং সময় স্লটসমূহ যুক্ত করুন।"
            >
              <div className="space-y-4">
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

                <div className="border-t border-slate-100 pt-3 dark:border-[#262b34]">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Generated / Custom Schedule Summary Text
                  </label>
                  <input
                    type="text"
                    value={form.scheduleText}
                    onChange={(e) => setForm({ ...form, scheduleText: e.target.value })}
                    placeholder="e.g. শনি (19:00 - 20:30), রবি (20:00 - 21:30)"
                    className={inputClass}
                  />
                </div>
              </div>
            </FormSection>

            {/* Section 4: Curriculum Clone */}
            {canDuplicate && <FormSection
              id="clone"
              icon={<Copy className="h-4 w-4" />}
              title="কারিকুলাম ক্লোনিং (ঐচ্ছিক)"
              description="পূর্বের কোনো ব্যাচের সিলেবাস ও নোটস কপি করে শুরু করতে চাইলে নির্বাচন করুন।"
            >
              <div className="rounded-2xl border border-orange-200/80 bg-orange-50/50 p-4 dark:border-orange-900/40 dark:bg-orange-950/20 sm:p-5">
                <p className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  অন্য কোনো ব্যাচের মডিউল, সেকশন এবং লেকচার কনটেন্ট এই ব্যাচে কপি করা হবে। কপি হওয়া কারিকুলাম সম্পূর্ণ স্বাধীন থাকবে—এখানে পরিবর্তন করলে মূল ব্যাচে প্রভাব পড়বে না।
                </p>
                <select
                  value={form.copyFromBatchId}
                  onChange={(e) => setForm({ ...form, copyFromBatchId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Start with blank / fresh syllabus (No cloning)</option>
                  {existingBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      Clone from: {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormSection>

            }
            {/* Sticky Action Bar */}
            <div className="ga-sticky-action-bar m-4 sm:m-5">
              <div className="mr-auto text-xs text-slate-500 dark:text-slate-400">
                সব তথ্য সঠিকভাবে পূরণ হয়েছে কিনা যাচাই করুন।
              </div>
              <div className="flex gap-2">
                <Link href={batchesHref}>
                  <Button type="button" variant="secondary" className="border border-slate-200 hover:bg-slate-100 dark:border-[#262b34] dark:hover:bg-[#151921]">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  isLoading={submitting}
                  className="bg-orange-600 font-bold text-white hover:bg-orange-700"
                >
                  Save & Create Batch
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateBatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50/50 p-6 dark:bg-[#0b0d12] sm:p-10">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-2xl border-2 border-orange-500/20 border-t-orange-600 bg-orange-600/10" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ব্যাচ ফর্ম লোড হচ্ছে...</p>
          </div>
        </div>
      }
    >
      <CreateBatchContent />
    </Suspense>
  );
}
