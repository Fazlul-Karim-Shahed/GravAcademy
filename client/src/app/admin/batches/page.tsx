'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, Button } from '@/components/ui';
import {
  Layers,
  PlusCircle,
  Copy,
  BookOpen,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Edit3,
  Trash2,
  MessageSquare,
  Filter,
  X,
  GraduationCap,
} from 'lucide-react';
import DailyScheduleView from '@/components/schedule/DailyScheduleView';
import { ScheduleSlot } from '@/lib/schedule';
import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';

interface Batch {
  _id: string;
  name: string;
  status: string;
  courseId: {
    _id: string;
    title: string;
    gradeLevel: string;
    subject: string;
  };
  scheduleText?: string;
  weeklySchedule?: ScheduleSlot[];
  capacity?: number;
  enrolledStudentCount?: number;
}

interface Course {
  _id: string;
  title: string;
  gradeLevel: string;
  subject: string;
}

function AdminBatchesContent() {
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || 'all';

  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const cid = searchParams.get('courseId');
    if (cid) {
      setSelectedCourseId(cid);
    } else {
      setSelectedCourseId('all');
    }
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, coursesRes, classList] = await Promise.all([
        api.get('/batches'),
        api.get('/courses'),
        getSharedAcademicClasses(),
      ]);
      if (batchesRes.data.success) setBatches(batchesRes.data.data);
      if (coursesRes.data.success) setCourses(coursesRes.data.data);
      if (classList) setAcademicClasses(classList);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete batch "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await api.delete(`/batches/${id}`);
      if (res.data?.success) {
        setMessage({ type: 'success', text: `✅ Batch "${name}" deleted successfully.` });
        loadData();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete batch.',
      });
    }
  };

  // 1. Only show classes for which courses actually exist in the database
  const classesWithCourses = React.useMemo(() => {
    const classNamesSet = new Set<string>();
    courses.forEach((c) => {
      if (c.gradeLevel && c.gradeLevel.trim()) {
        classNamesSet.add(c.gradeLevel.trim());
      }
    });

    // Match with academicClasses if available, or fallback to class names
    const result: { id: string; name: string }[] = [];
    classNamesSet.forEach((name) => {
      const match = academicClasses.find((ac) => ac.name.trim().toLowerCase() === name.toLowerCase());
      result.push({
        id: match ? match._id : name,
        name: match ? match.name : name,
      });
    });

    // Sort logically
    return result.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [courses, academicClasses]);

  // 2. Courses filtered dynamically by selected class
  const availableCourses = React.useMemo(() => {
    if (selectedClass === 'all') return courses;
    return courses.filter((c) => c.gradeLevel?.trim().toLowerCase() === selectedClass.trim().toLowerCase());
  }, [courses, selectedClass]);

  const filteredBatches = batches.filter((b) => {
    const courseObj = typeof b.courseId === 'object' && b.courseId !== null ? b.courseId : null;
    const cId = courseObj ? courseObj._id : b.courseId;
    const grade = courseObj?.gradeLevel;

    // Filter by Class
    if (selectedClass !== 'all') {
      if (!grade || grade.trim().toLowerCase() !== selectedClass.trim().toLowerCase()) {
        return false;
      }
    }

    // Filter by Course
    if (selectedCourseId !== 'all') {
      if (String(cId) !== String(selectedCourseId)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-blue-600 dark:text-blue-500" /> Batch Management
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/admin/courses"
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors"
            >
              Manage Courses
            </Link>
            <Link
              href="/admin/batches/new"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Create New Batch
            </Link>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 border shadow-2xs ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3 w-full md:w-auto">
            {/* ১. ক্লাস অনুযায়ী ফিল্টার */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <span>ক্লাস:</span>
              </div>
              <select
                value={selectedClass}
                onChange={(e) => {
                  const newClass = e.target.value;
                  setSelectedClass(newClass);
                  // If selected course doesn't match new class, reset course filter
                  if (newClass !== 'all' && selectedCourseId !== 'all') {
                    const currentCourse = courses.find((c) => c._id === selectedCourseId);
                    if (currentCourse && currentCourse.gradeLevel?.trim().toLowerCase() !== newClass.trim().toLowerCase()) {
                      setSelectedCourseId('all');
                    }
                  }
                }}
                className="flex-1 sm:flex-initial bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer min-w-0"
              >
                <option value="all">সকল ক্লাস (All Classes)</option>
                {classesWithCourses.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* সেপারেটর পাইপ */}
            <span className="hidden sm:inline-block w-px h-5 bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* ২. কোর্স অনুযায়ী ফিল্টার */}
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                <Filter className="w-4 h-4 text-blue-500" />
                <span>কোর্স:</span>
              </div>

              <select
                value={selectedCourseId}
                onChange={(e) => {
                  const cid = e.target.value;
                  setSelectedCourseId(cid);
                  // Auto-sync class filter if a specific course is picked
                  if (cid !== 'all') {
                    const picked = courses.find((c) => c._id === cid);
                    if (picked?.gradeLevel && selectedClass === 'all') {
                      setSelectedClass(picked.gradeLevel);
                    }
                  }
                }}
                className="flex-1 sm:flex-initial bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:max-w-xs min-w-0 truncate"
              >
                <option value="all">সকল কোর্স (All Courses)</option>
                {availableCourses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.gradeLevel} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            {(selectedCourseId !== 'all' || selectedClass !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCourseId('all');
                  setSelectedClass('all');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer w-full sm:w-auto shrink-0"
                title="সকল ফিল্টার মুছুন"
              >
                <X className="w-3.5 h-3.5" />
                <span>ফিল্টার রিসেট</span>
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
            মোট ব্যাচ:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">
              {filteredBatches.length}
            </span>{' '}
            টি
          </div>
        </div>

        {/* Batch Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-3xl bg-white dark:bg-slate-900/60 animate-pulse border border-slate-200/80 dark:border-slate-800"
              />
            ))}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl text-center py-16 px-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedCourseId !== 'all'
                ? 'এই কোর্সে এখনও কোনো ব্যাচ তৈরি করা হয়নি'
                : 'No batches created yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              {selectedCourseId !== 'all'
                ? 'নতুন ব্যাচ তৈরি করুন অথবা ফিল্টার পরিবর্তন করুন।'
                : 'Create your first batch or clone an existing curriculum to get started.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {selectedCourseId !== 'all' && (
                <button
                  onClick={() => setSelectedCourseId('all')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                >
                  সকল ব্যাচ দেখুন
                </button>
              )}
              <Link
                href={`/admin/batches/new${selectedCourseId !== 'all' ? `?courseId=${selectedCourseId}` : ''}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Create Batch
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredBatches.map((batch, idx) => {
              const batchAccents = [
                'from-blue-600 via-indigo-600 to-violet-700',
                'from-violet-600 via-purple-600 to-fuchsia-700',
                'from-emerald-600 via-teal-600 to-cyan-700',
                'from-amber-500 via-orange-600 to-rose-600',
                'from-cyan-600 via-sky-600 to-indigo-700',
              ];
              const accentGradient = batchAccents[idx % batchAccents.length];

              return (
                <div
                  key={batch._id}
                  className="group relative bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-2xl hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle Top Ambient Gradient Line */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${accentGradient} opacity-90`} />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Top Badges Row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-black">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        {batch.courseId?.gradeLevel || 'Class 6 - 12'}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs ${
                          batch.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80'
                            : batch.status === 'upcoming'
                            ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/80'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${batch.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {batch.status}
                      </span>
                    </div>

                    {/* Batch Name & Course Title */}
                    <div className="mb-4 flex-1">
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1.5">
                        {batch.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                        {batch.courseId?.title || 'Unassigned Course'}
                      </p>
                    </div>

                    {/* Schedule Pill */}
                    {batch.scheduleText ? (
                      <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                        <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold truncate">{batch.scheduleText}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 italic">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>শিডিউল নির্ধারিত হয়নি</span>
                      </div>
                    )}

                    {/* Capacity & Enrolled Students 2-Column / Grid Info */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">এনরোল্ড শিক্ষার্থী</span>
                        <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{batch.enrolledStudentCount ?? 0} জন</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">আসন সংখ্যা</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          {batch.capacity ? `${batch.capacity} জন` : 'সীমাহীন'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/classroom/${batch._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                        title="ক্লাসরুম ও ডিসকাশন গ্রুপ"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>ক্লাসরুম</span>
                      </Link>

                      <Link
                        href={`/admin/batches/${batch._id}/curriculum`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>কারিকুলাম</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/batches/${batch._id}/edit`}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Batch Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>

                      <Link
                        href={`/admin/batches/new?cloneFrom=${batch._id}`}
                        className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                        title="Duplicate & Create New Batch"
                      >
                        <Copy className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDeleteBatch(batch._id, batch.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default function AdminBatchesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 flex items-center justify-center">
          <div className="text-xs font-bold text-slate-400">লোড হচ্ছে...</div>
        </div>
      }
    >
      <AdminBatchesContent />
    </Suspense>
  );
}
