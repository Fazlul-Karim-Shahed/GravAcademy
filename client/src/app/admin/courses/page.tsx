'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  PlusCircle,
  Edit3,
  Trash2,
  GraduationCap,
  Layers,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  X,
  ExternalLink,
  Clock,
  Sparkles,
  Tag,
  Banknote,
} from 'lucide-react';
import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  gradeLevel: string;
  subject: string;
  courseFee: number;
  regularPrice?: number;
  discountPrice?: number;
  duration?: string;
  isPublished: boolean;
  createdAt: string;
}

interface BatchInfo {
  _id: string;
  name: string;
  courseId: string | { _id: string };
  status: string;
}

function AdminCoursesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const gradeQuery = searchParams.get('grade') || 'all';

  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(gradeQuery);

  // Sync selectedGrade if URL query parameter changes
  useEffect(() => {
    if (gradeQuery) {
      setSelectedGrade(gradeQuery);
    }
  }, [gradeQuery]);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [academicClasses, setAcademicClasses] = useState<AcademicClassItem[]>([]);

  const gradeOptions = academicClasses.map((ac) => ac.name);

  useEffect(() => {
    fetchAcademicClasses();
  }, []);

  const fetchAcademicClasses = async () => {
    const list = await getSharedAcademicClasses();
    setAcademicClasses(list);
  };

  useEffect(() => {
    fetchCoursesAndBatches();
  }, [selectedGrade]);

  const fetchCoursesAndBatches = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedGrade !== 'all') params.gradeLevel = selectedGrade;
      if (search) params.search = search;

      const [courseRes, batchRes] = await Promise.allSettled([
        api.get('/courses', { params }),
        api.get('/batches'),
      ]);

      if (courseRes.status === 'fulfilled' && courseRes.value.data?.success) {
        setCourses(courseRes.value.data.data);
      }
      if (batchRes.status === 'fulfilled' && batchRes.value.data?.success) {
        setBatches(batchRes.value.data.data);
      }
    } catch (err: any) {
      console.error('Fetch courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = fetchCoursesAndBatches;

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await api.delete(`/courses/${id}`);
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Course "${title}" deleted successfully.` });
        fetchCourses();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete course.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" /> Course Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Create, edit, organize syllabus, and publish courses dynamically for Class 6 to Class 12.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/classes"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Manage Classes
            </Link>
            <Link
              href="/admin/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Add New Course
            </Link>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 shadow-2xs ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
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

        {/* Filter / Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 mb-8 flex flex-wrap items-center justify-between gap-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCourses()}
                placeholder="Search courses..."
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9.5 pr-3.5 py-2.5 w-64 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Class Levels</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchCourses}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Filter
            </button>
            {selectedGrade !== 'all' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold">
                <span>Class: {selectedGrade}</span>
                <button
                  type="button"
                  onClick={() => setSelectedGrade('all')}
                  className="p-0.5 hover:text-rose-500 rounded"
                  title="ফিল্টার ক্লিয়ার করুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Courses: <strong className="text-slate-900 dark:text-white">{courses.length}</strong>
          </span>
        </div>

        {/* Courses List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl text-center py-16 px-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No courses created yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Click &apos;Add New Course&apos; to create your first dynamic curriculum.
            </p>
            <Link
              href="/admin/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Add Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {courses.map((course, idx) => {
              // Curated glowing gradients with refined hues
              const cardThemes = [
                {
                  gradient: 'from-blue-600 via-indigo-600 to-violet-800',
                  accent: 'blue',
                  tagBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
                  glow: 'group-hover:shadow-blue-500/10',
                },
                {
                  gradient: 'from-violet-600 via-purple-600 to-fuchsia-700',
                  accent: 'purple',
                  tagBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
                  glow: 'group-hover:shadow-purple-500/10',
                },
                {
                  gradient: 'from-emerald-600 via-teal-600 to-cyan-800',
                  accent: 'emerald',
                  tagBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                  glow: 'group-hover:shadow-emerald-500/10',
                },
                {
                  gradient: 'from-amber-500 via-orange-600 to-rose-600',
                  accent: 'amber',
                  tagBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
                  glow: 'group-hover:shadow-amber-500/10',
                },
                {
                  gradient: 'from-cyan-600 via-sky-600 to-indigo-700',
                  accent: 'sky',
                  tagBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
                  glow: 'group-hover:shadow-sky-500/10',
                },
              ];
              const theme = cardThemes[idx % cardThemes.length];

              return (
                <div
                  key={course._id}
                  className={`group relative bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-2xl ${theme.glow} hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between overflow-hidden backdrop-blur-xs`}
                >
                  {/* Subtle Top Accent Ambient Line */}
                  <div className={`h-1 w-full bg-gradient-to-r ${theme.gradient} opacity-90`} />

                  <div className="flex flex-col flex-1">
                    {/* Thumbnail & Badges Container */}
                    <div className="relative w-full aspect-[16/9.5] bg-slate-900 overflow-hidden">
                      {course.thumbnailUrl ? (
                        <>
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />
                        </>
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center relative p-6 overflow-hidden`}>
                          {/* Geometric Ambient Circles */}
                          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/20 blur-lg pointer-events-none" />
                          
                          <div className="relative text-center text-white z-10">
                            <div className="w-13 h-13 mx-auto mb-2.5 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                              <BookOpen className="w-6 h-6 text-white drop-shadow-md" />
                            </div>
                            <span className="text-[11px] font-black tracking-widest uppercase opacity-90">
                              {course.gradeLevel}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Floating Header Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/75 backdrop-blur-md text-white text-[11px] font-black tracking-wide border border-white/15 shadow-md">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                          {course.gradeLevel}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-md backdrop-blur-md border ${
                            course.isPublished
                              ? 'bg-emerald-500/90 text-white border-emerald-400/40 shadow-emerald-500/20'
                              : 'bg-amber-500/90 text-white border-amber-400/40 shadow-amber-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${course.isPublished ? 'bg-white animate-pulse' : 'bg-white/80'}`} />
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex-1">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-4">
                          {course.title}
                        </h3>
                      </div>

                      {/* Meta Information Cards */}
                      {(() => {
                        const courseBatches = batches.filter((b) => {
                          const cId = typeof b.courseId === 'object' && b.courseId !== null ? b.courseId._id : b.courseId;
                          return String(cId) === String(course._id);
                        });
                        const batchCount = courseBatches.length;

                        const regular = course.regularPrice ?? course.courseFee ?? 0;
                        const discount = course.discountPrice;
                        const hasDiscount = typeof discount === 'number' && discount > 0 && regular > discount;

                        return (
                          <div className="grid grid-cols-3 divide-x divide-slate-200/70 dark:divide-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-1">
                            {/* Course Fee */}
                            <div className="px-2 min-w-0">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight mb-0.5">কোর্স ফি</span>
                              {hasDiscount ? (
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                    ৳{discount?.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] line-through text-slate-400 font-semibold">
                                    ৳{regular.toLocaleString()}
                                  </span>
                                </div>
                              ) : regular > 0 ? (
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block">
                                  ৳{regular.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate block">
                                  ফ্রি
                                </span>
                              )}
                            </div>

                            {/* Duration */}
                            <div className="px-2 min-w-0">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight mb-0.5">মেয়াদকাল</span>
                              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block">
                                {course.duration || '১ বছর'}
                              </span>
                            </div>

                            {/* Batches */}
                            <Link
                              href={`/admin/batches?courseId=${course._id}`}
                              className="group/batch block px-2 min-w-0 rounded-xl hover:bg-white dark:hover:bg-slate-900/80 transition-colors"
                              title="ক্লিক করে এই কোর্সের ব্যাচসমূহ দেখুন বা ম্যানেজ করুন"
                            >
                              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight mb-0.5">মোট ব্যাচ</span>
                              <span className="text-xs font-black text-purple-600 dark:text-purple-400 group-hover/batch:underline truncate block">
                                {batchCount} টি ব্যাচ
                              </span>
                            </Link>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                    <Link
                      href={`/courses/${course.slug || course._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/90 dark:border-slate-700/80 transition-all shadow-2xs hover:shadow-xs group/btn"
                    >
                      <span>ভিউ পেজ</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-blue-500 transition-colors" />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/courses/${course._id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/60 dark:border-blue-800/60 transition-colors"
                        title="Edit Course Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>এডিট</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(course._id, course.title)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Course"
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

export default function AdminCoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 sm:p-10 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">কোর্স লোড হচ্ছে...</p>
          </div>
        </div>
      }
    >
      <AdminCoursesContent />
    </Suspense>
  );
}

