'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  GraduationCap,
  Users,
  Clock,
  Layers,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Video,
  FileText,
  Award,
  Check,
  Edit,
  PhoneCall,
} from 'lucide-react';

interface Batch {
  _id: string;
  name: string;
  capacity?: number;
  scheduleText?: string;
  status: string;
  startDate?: string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface CourseDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  gradeLevel: string;
  subject: string;
  courseFee: number;
  duration?: string;
  targetAudience?: string;
  instructors?: Teacher[];
  curriculumHighlights?: string[];
  features?: string[];
}

export default function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseAndBatches();
  }, [resolvedParams.id]);

  const fetchCourseAndBatches = async () => {
    setLoading(true);
    try {
      // 1. Fetch course details
      const courseRes = await api.get(`/courses/${resolvedParams.id}`);
      if (courseRes.data?.success) {
        setCourse(courseRes.data.data);
      }

      // 2. Fetch batches for this course (batches endpoint accepts query param courseId)
      try {
        const batchesRes = await api.get(`/batches?courseId=${resolvedParams.id}`);
        if (batchesRes.data?.success) {
          setBatches(batchesRes.data.data || []);
        }
      } catch (batchErr) {
        console.warn('Batches not loaded for course:', batchErr);
      }
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 text-center">
        <div className="max-w-md mx-auto px-4">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">কোর্সের বিস্তারিত তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 text-center">
        <div className="max-w-md mx-auto px-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">কোর্সটি খুঁজে পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            এই কোর্সটি হয়তো সরিয়ে নেওয়া হয়েছে বা ঠিকানাটি সঠিক নয়।
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> সকল কোর্সের তালিকায় ফিরুন
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const defaultHighlights = [
    'সম্পূর্ণ অধ্যায়ভিত্তিক বিস্তারিত কনসেপ্ট ও বেসিক ক্লিয়ারিং ক্লাস',
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
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link
              href="/courses"
              className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> সকল কোর্স
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200">{course.gradeLevel}</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400">{course.subject}</span>
          </div>

          {isAdmin && (
            <Link
              href={`/admin/courses/${course._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> এডমিন প্যানেলে এডিট করুন
            </Link>
          )}
        </div>

        {/* HERO BANNER SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-8 sm:p-12 mb-10 shadow-2xl">
          <div className="relative z-10 max-w-4xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-extrabold border border-white/20">
                {course.gradeLevel}
              </span>
              <span className="px-3.5 py-1 rounded-full bg-blue-500/30 backdrop-blur-md text-blue-100 text-xs font-bold border border-blue-400/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                {course.subject}
              </span>
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/30 backdrop-blur-md text-emerald-200 text-xs font-extrabold border border-emerald-400/30">
                ভর্তি চলছে
              </span>
            </div>

            {/* Course Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.28]">
              {course.title}
            </h1>

            {/* Overview text */}
            <p className="mt-4 text-slate-200 text-sm sm:text-base leading-relaxed max-w-3xl">
              {course.description ||
                'সম্পূর্ণ সিলেবাস কভার করে বেসিক টু অ্যাডভান্সড লেভেলের পাঠদান, টেস্ট পেপার সলভিং এবং সার্বক্ষণিক মেন্টরশিপ।'}
            </p>

            {/* Highlights Bar */}
            <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
              <div>
                <span className="text-slate-300 block mb-1">কোর্সের মেয়াদ</span>
                <span className="text-white font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-300" />
                  {course.duration || 'পূর্ণাঙ্গ সেশন'}
                </span>
              </div>

              <div>
                <span className="text-slate-300 block mb-1">চলতি ব্যাচ</span>
                <span className="text-white font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-300" />
                  {batches.length} টি ব্যাচ সক্রিয়
                </span>
              </div>

              <div>
                <span className="text-slate-300 block mb-1">বিষয়</span>
                <span className="text-white font-extrabold text-sm sm:text-base">
                  {course.subject}
                </span>
              </div>

              <div>
                <span className="text-slate-300 block mb-1">কোর্স ফি</span>
                <span className="text-emerald-300 font-black text-base sm:text-xl">
                  {course.courseFee === 0 ? 'ফ্রি' : `৳ ${course.courseFee.toLocaleString()}`}
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
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      এই কোর্সটি কাদের জন্য?
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
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                এই কোর্সে যা যা শেখানো হবে
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                বোর্ড পরীক্ষায় শতভাগ সাফল্যের নিশ্চয়তায় সাজানো পূর্ণাঙ্গ সিলেবাস রূপরেখা।
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
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                      {h}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* FACULTY TEACHERS SECTION */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  কোর্সের নিবেদিত শিক্ষকবৃন্দ
                </h2>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                  {course.instructors && course.instructors.length > 0
                    ? `${course.instructors.length} জন শিক্ষক`
                    : 'গ্র্যাভ একাডেমি শিক্ষক প্যানেল'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                শীর্ষ বিশ্ববিদ্যালয়ের অভিজ্ঞ শিক্ষকদের তত্ত্বাবধানে লাইভ ক্লাস ও নিয়মিত ডাউট সলভ সেশন।
              </p>

              {course.instructors && course.instructors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.instructors.map((t) => (
                    <div
                      key={t._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:border-blue-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-md">
                        {t.avatarUrl ? (
                          <img src={t.avatarUrl} alt={t.name} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          t.name.slice(0, 2)
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {course.subject} স্পেশালিস্ট
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                          {t.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          গ্র্যাভ একাডেমি ফ্যাকাল্টি মেম্বার
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                    GA
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">গ্র্যাভ একাডেমি সিনিয়র ফ্যাকাল্টি</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      বিষয়ভিত্তিক দক্ষ শিক্ষকদের মাধ্যমে ব্যাচসমূহে লাইভ ক্লাস পরিচালিত হচ্ছে।
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
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">লাইভ ও রেকর্ডেড ক্লাস</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  লাইভ ক্লাসে অংশ নেওয়ার পাশাপাশি যেকোনো সময় রেকর্ডেড ভিডিও দেখে রিভিশনের সুবিধা।
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">প্রিমিয়াম লেকচার শিট</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  অধ্যায়ভিত্তিক সূত্র, হ্যান্ডনোট ও প্রশ্নোত্তরের নিখুঁত পিডিএফ সরাসরি ডাউনলোডের সুযোগ।
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">মডেল টেস্ট ও মূল্যায়ন</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  অটোমেটেড অনলাইন পরীক্ষা, মেধাতালিকা এবং সাথে সাথেই সঠিক উত্তরের বিশ্লেষণ।
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
                    রুটিন ও সময়সূচি
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    চলতি ব্যাচসমূহ
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                  {batches.length} টি ব্যাচ
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                পছন্দের যেকোনো সক্রিয় ব্যাচ নির্বাচন করে ক্লাসরুমে প্রবেশ করুন ও পড়াশোনা শুরু করুন:
              </p>

              {/* Batches List */}
              {batches.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    বর্তমানে কোনো সক্রিয় ব্যাচ নেই
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    নতুন ব্যাচের রুটিন খুব শীঘ্রই যুক্ত করা হবে। যেকোনো তথ্যের জন্য আমাদের কল করুন।
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <div
                      key={batch._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {batch.status === 'active' ? 'সক্রিয়' : batch.status}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> আসন: {batch.capacity || 40} জন
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">
                          {batch.name}
                        </h4>

                        {batch.scheduleText ? (
                          <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="text-[11px] font-semibold leading-tight">{batch.scheduleText}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic mb-4">নিয়মিত ক্লাসের সময়সূচি</div>
                        )}
                      </div>

                      <Link
                        href={`/learn/${batch._id}`}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <span>ক্লাসরুমে প্রবেশ করুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Assistance Box */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  ব্যাচ ও ভর্তি সংক্রান্ত যেকোনো সহায়তায়:
                </span>
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" /> ১৬৯১০ / ০১৭০০-০০০০০০
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
