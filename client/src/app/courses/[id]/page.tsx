'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  GraduationCap,
  Layers,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
  Check,
  Award,
  Video,
  FileText,
  HelpCircle,
  Phone,
  Mail,
  ShieldCheck,
  Edit,
} from 'lucide-react';

interface Instructor {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  role: string;
}

interface Batch {
  _id: string;
  name: string;
  status: string;
  scheduleText?: string;
  capacity?: number;
  students?: any[];
}

interface Course {
  _id: string;
  title: string;
  description: string;
  gradeLevel: string;
  subject: string;
  courseFee: number;
  duration?: string;
  thumbnailUrl?: string;
  targetAudience?: string;
  curriculumHighlights?: string[];
  features?: string[];
  instructors?: Instructor[];
}

export const dynamic = 'force-dynamic';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
            <div className="h-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
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

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const defaultHighlights = [
    'সম্পূর্ণ অধ্যায়ভিত্তিক বিস্তারিত কনসেপ্ট ও বেসিক ক্লিয়ারিং ক্লাস',
    'বোর্ড প্রশ্ন বিশ্লেষণ ও বিগত বছরের টেস্ট পেপার সলভিং',
    'সাপ্তাহিক লাইভ ইন্টারঅ্যাক্টিভ ডাউট সলভিং ও রিভিশন সেশন',
    'গুগল ড্রাইভে প্রতিটি ক্লাসের পূর্ণাঙ্গ লেকচার শিট ও ফর্মুলা বুকলেট',
    'টাইমড অনলাইন এমসিকিউ (MCQ) ও রিটেন প্র্যাকটিস এক্সাম',
  ];

  const highlights =
    course.curriculumHighlights && course.curriculumHighlights.length > 0
      ? course.curriculumHighlights
      : defaultHighlights;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb & Admin Edit Quick Link */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link
              href="/courses"
              className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200 font-semibold">{course.gradeLevel}</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{course.subject}</span>
          </div>

          {isAdmin && (
            <Link
              href={`/admin/courses/${course._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/80 dark:border-blue-700/50 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Edit This Course in Admin
            </Link>
          )}
        </div>

        {/* HERO BANNER SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-8 sm:p-12 mb-10 shadow-2xl">
          <div className="relative z-10 max-w-4xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                {course.gradeLevel}
              </span>
              <span className="px-3.5 py-1 rounded-full bg-blue-500/30 backdrop-blur-md text-blue-100 text-xs font-semibold border border-blue-400/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                {course.subject}
              </span>
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/30 backdrop-blur-md text-emerald-200 text-xs font-bold border border-emerald-400/30">
                Admissions Open
              </span>
            </div>

            {/* Course Big Title */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {course.title}
            </h1>

            {/* Overview text */}
            <p className="mt-4 text-slate-200 text-sm sm:text-base leading-relaxed max-w-3xl">
              {course.description ||
                'Comprehensive academic coaching curriculum structured with high-yield concepts, board question analysis, lecture notes, and active mentoring.'}
            </p>

            {/* Highlights Bar */}
            <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
              <div>
                <span className="text-slate-300 block mb-0.5">Duration Scope</span>
                <span className="text-white font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-300" />
                  {course.duration || 'Full Session'}
                </span>
              </div>

              <div>
                <span className="text-slate-300 block mb-0.5">Total Batches</span>
                <span className="text-white font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-300" />
                  {batches.length} Active {batches.length === 1 ? 'Batch' : 'Batches'}
                </span>
              </div>

              <div>
                <span className="text-slate-300 block mb-0.5">Subject Stream</span>
                <span className="text-white font-bold text-sm sm:text-base">
                  {course.subject}
                </span>
              </div>

              <div>
                <span className="text-slate-300 block mb-0.5">Standard Fee</span>
                <span className="text-emerald-300 font-extrabold text-base sm:text-xl">
                  {course.courseFee === 0 ? 'Free' : `৳ ${course.courseFee.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {/* Background Decorative Rings */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-10 top-10 w-60 h-60 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
        </div>

        {/* MAIN BODY: 2 COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Course Curriculum, Learning Outcomes & Teachers */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Target Audience Banner */}
            {course.targetAudience && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Who Is This Course Designed For?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {course.targetAudience}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What Students Will Learn (Syllabus Highlights) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                What You Will Learn in This Course
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                Comprehensive syllabus outline guaranteed to build rock-solid fundamentals for board exams.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {h}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* FACULTY TEACHERS SECTION */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Course Faculty & Instructors
                </h2>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                  {course.instructors && course.instructors.length > 0
                    ? `${course.instructors.length} Instructors`
                    : 'Grav Academic Faculty'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                Classes and live problem-solving sessions are conducted by top educators in this subject.
              </p>

              {course.instructors && course.instructors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.instructors.map((t) => (
                    <div
                      key={t._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:border-blue-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-md">
                        {t.avatarUrl ? (
                          <img src={t.avatarUrl} alt={t.name} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          t.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {course.subject} Specialist
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                          {t.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Grav Academy Academic Faculty
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                    GA
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Grav Academy Senior Faculty</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Assigned subject specialist instructors manage batches and live interactive sessions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Video className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Live & Recorded</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Attend real-time Google Meet/Zoom classes with instant access to recorded archives.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Drive Notes</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  High-resolution formula sheets and lecture notes synced straight to Drive.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Chapter Assessments</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Server-side auto-graded MCQ tests with instant rank lists and performance analytics.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT 1 COLUMN: AVAILABLE BATCHES & ENROLLMENT CTA */}
          <div className="space-y-6">
            
            {/* Active Batches Section Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/30 dark:shadow-none sticky top-20">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Live Schedules
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    Available Batches
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Choose an active batch below to access its live lecture schedule, classroom notes, and student enrollment:
              </p>

              {/* Batches List */}
              {batches.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No active batches scheduled yet
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Please check back shortly or contact our desk for upcoming admission dates.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <div
                      key={batch._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                            {batch.status}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" /> Max {batch.capacity || 40} Seats
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                          {batch.name}
                        </h4>

                        {batch.scheduleText ? (
                          <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-4">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="text-[11px] font-medium leading-tight">{batch.scheduleText}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic mb-4">Flexible regular syllabus</div>
                        )}
                      </div>

                      <Link
                        href={`/learn/${batch._id}`}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <span>Enter Learning Room</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Assistance Box */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Have questions regarding batch timings?
                </span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Call Support: +880 1700-000000
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
