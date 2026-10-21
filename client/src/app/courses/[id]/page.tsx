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
  ArrowRight,
  ArrowLeft,
  Video,
  FileText,
  Award,
  Check,
  Edit,
  PhoneCall,
  ShieldCheck,
  Sparkles,
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
      // 1. Fetch course details (supports both slug and _id)
      const courseRes = await api.get(`/courses/${resolvedParams.id}`);
      if (courseRes.data?.success) {
        const loadedCourse = courseRes.data.data;
        setCourse(loadedCourse);

        // 2. Fetch batches using the actual course MongoDB _id (since backend expects ObjectId for courseId)
        try {
          const actualCourseId = loadedCourse._id || resolvedParams.id;
          const batchesRes = await api.get(`/batches?courseId=${actualCourseId}`);
          if (batchesRes.data?.success) {
            setBatches(batchesRes.data.data || []);
          }
        } catch (batchErr) {
          console.warn('Batches not loaded for course:', batchErr);
        }
      }
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-24 text-center">
        <div className="max-w-md mx-auto px-4">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">কোর্সের তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-24 text-center">
        <div className="max-w-md mx-auto px-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">কোর্সটি পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-6 leading-relaxed">
            এই কোর্সটি হয়তো সরিয়ে নেওয়া হয়েছে বা ঠিকানাটি সঠিক নয়।
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> সকল কোর্সের তালিকায় ফিরুন
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const regularPrice = course.courseFee ? Math.round(course.courseFee * 1.35) : null;

  const defaultHighlights = [
    'সম্পূর্ণ অধ্যায়ভিত্তিক বিস্তারিত কনসেপ্ট ও বেসিক ক্লিয়ারিং লাইভ ক্লাস',
    'বোর্ড প্রশ্ন বিশ্লেষণ এবং শীর্ষ স্কুল/কলেজের টেস্ট পেপার সলভিং',
    'সাপ্তাহিক লাইভ ইন্টারঅ্যাক্টিভ ডাউট সলভিং ও রিভিশন সেশন',
    'প্রতিটি ক্লাসের পূর্ণাঙ্গ অধ্যায়ভিত্তিক লেকচার শিট ও ফর্মুলা বুকলেট',
    'টাইমড অনলাইন এমসিকিউ (MCQ) ও স্ট্যান্ডার্ড রিটেন প্র্যাকটিস এক্সাম',
  ];

  const highlights =
    course.curriculumHighlights && course.curriculumHighlights.length > 0
      ? course.curriculumHighlights
      : defaultHighlights;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. PROFESSIONAL EDITORIAL HERO WITH RICH GRADIENT TEXTURE */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white pt-8 pb-12 sm:pb-14 border-b border-slate-800 shadow-lg">
        {/* Subtle Geometric Background Lighting & Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Link
                href="/courses"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-400" /> সকল কোর্স
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200 font-bold">{course.gradeLevel}</span>
              <span className="text-slate-600">/</span>
              <span className="text-blue-400 font-bold">{course.subject}</span>
            </div>

            {isAdmin && (
              <Link
                href={`/admin/courses/${course._id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur-md transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-blue-300" /> কোর্স এডিট করুন
              </Link>
            )}
          </div>

          {/* Hero Main Content */}
          <div className="max-w-4xl">
            {/* Meta Category Indicator */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                {course.gradeLevel} • {course.subject} স্পেশাল প্রোগ্রাম
              </span>
            </div>

            {/* Course Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-white leading-[1.28]">
              {course.title}
            </h1>

            {/* Overview description */}
            <p className="mt-4 text-base sm:text-lg text-slate-200/90 leading-[1.8] max-w-3xl">
              {course.description ||
                'সম্পূর্ণ সিলেবাস কভার করে বেসিক টু অ্যাডভান্সড লেভেলের পাঠদান, টেস্ট পেপার সলভিং এবং বোর্ড পরীক্ষার চূড়ান্ত প্রস্তুতি।'}
            </p>

            {/* Micro Metadata Strip with Glass Elements */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 mt-7 pt-6 border-t border-white/10 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-200">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>মেয়াদ: <strong className="text-white font-extrabold">{course.duration || 'পূর্ণাঙ্গ সেশন'}</strong></span>
              </div>

              <div className="flex items-center gap-2 text-slate-200">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>সক্রিয় ব্যাচ: <strong className="text-white font-extrabold">{batches.length} টি</strong></span>
              </div>

              <div className="flex items-center gap-2 text-slate-200">
                <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ফ্যাকাল্টি: <strong className="text-white font-extrabold">{course.instructors?.length || 1} জন শিক্ষক</strong></span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 2. MAIN 2-COLUMN SECTION: Content on Left, Sticky Enrollment Card on Right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT COLUMN: Curriculum, Teachers & Highlights (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Target Audience */}
            {course.targetAudience && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    টার্গেট অডিয়েন্স
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  এই কোর্সটি কাদের জন্য?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {course.targetAudience}
                </p>
              </div>
            )}

            {/* Syllabus & Highlights */}
            <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    সিলেবাস ও পাঠ পরিকল্পনা
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-900/60 px-3 py-1 rounded-full">
                  {highlights.length} টি বিশেষ মডিউল
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                এই কোর্সে যা যা শেখানো হবে
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-7 leading-relaxed">
                বোর্ড পরীক্ষায় শতভাগ সাফল্যের জন্য কনসেপ্ট, প্র্যাকটিস এবং পরীক্ষার সুবিন্যস্ত রোডম্যাপ।
              </p>

              <div className="grid grid-cols-1 gap-3.5">
                {highlights.map((h, i) => (
                  <div
                    key={i}
                    className="group relative flex items-start gap-4 p-4 sm:p-4.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 hover:border-blue-500/60 dark:hover:border-blue-500/60 hover:bg-white dark:hover:bg-slate-900 hover:shadow-md transition-all duration-200"
                  >
                    {/* Index Number Badge */}
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-bold leading-[1.7]">
                        {h}
                      </p>
                    </div>

                    {/* Verified Icon Accent */}
                    <div className="shrink-0 pt-1 text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructors Section */}
            <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  শিক্ষক প্যানেল
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                কোর্সের অভিজ্ঞ শিক্ষকবৃন্দ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                বুয়েট, ঢাকা বিশ্ববিদ্যালয় ও শীর্ষ মেডিকেল কলেজের অভিজ্ঞ শিক্ষকবৃন্দের তত্ত্বাবধানে বিষয়ভিত্তিক পাঠদান।
              </p>

              {course.instructors && course.instructors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.instructors.map((t) => (
                    <div
                      key={t._id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-slate-700 dark:text-slate-200 font-extrabold text-base">
                        {t.avatarUrl ? (
                          <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          t.name.slice(0, 2)
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {course.subject} স্পেশালিস্ট
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                          {t.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          গ্র্যাভ একাডেমি মেন্টর
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                    GA
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">গ্র্যাভ একাডেমি শিক্ষক প্যানেল</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      বিষয়ভিত্তিক দক্ষ সিনিয়র শিক্ষকবৃন্দের মাধ্যমে ব্যাচসমূহে লাইভ ক্লাস পরিচালিত হচ্ছে।
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3 Core Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Video className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">লাইভ ক্লাস</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  ডিজিটাল স্মার্টবোর্ডে প্রশ্নোত্তরমূলক লাইভ ইন্টারঅ্যাক্টিভ ক্লাস ও ডাউট সলভ।
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">হ্যান্ডনোট ও পিডিএফ</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  অধ্যায়ভিত্তিক সূত্র, ফর্মুলা বুক ও বোর্ড সমাধান সরাসরি ডাউনলোডের সুযোগ।
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">মডেল টেস্ট ও মূল্যায়ন</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  টাইমড অনলাইন পরীক্ষা, অটোমেটেড মেধা তালিকা ও বিস্তারিত ব্যাখ্যা।
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Modern Enrollment & Batch Selection Card (5 Cols Sticky) */}
          <div className="lg:col-span-5 sticky top-20 space-y-6">
            
            {/* Enrollment Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-7 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
              
              {/* Pricing Box */}
              <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">কোর্স ফি</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
                    {course.courseFee ? `৳ ${course.courseFee.toLocaleString()}` : 'ফ্রি'}
                  </span>
                  {regularPrice && (
                    <span className="text-sm text-slate-400 line-through font-semibold">
                      ৳ {regularPrice.toLocaleString()}
                    </span>
                  )}
                  {regularPrice && (
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-200/80 dark:border-rose-900/60 ml-auto">
                      ২৬% ছাড়
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  একবার ফি পরিশোধে পুরো কোর্সের সকল লাইভ ক্লাস ও নোট উন্মুক্ত হবে।
                </p>
              </div>

              {/* Batches Header */}
              <div className="py-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    চলতি ব্যাচ ও সময়সূচি
                  </h3>
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-lg">
                    {batches.length}টি ব্যাচ
                  </span>
                </div>

                {batches.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">
                      নতুন ব্যাচের শিডিউল শীঘ্রই যুক্ত হচ্ছে।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-3">
                    {batches.map((batch) => (
                      <div
                        key={batch._id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {batch.name}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            সক্রিয়
                          </span>
                        </div>

                        {batch.scheduleText && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>{batch.scheduleText}</span>
                          </div>
                        )}

                        <Link
                          href={`/learn/${batch._id}`}
                          className="mt-3 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>এই ব্যাচে ক্লাস করুন</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guarantees List */}
              <div className="pt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>নিরাপদ বিকাশ / নগদ অনলাইন পেমেন্ট</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>লাইভ ক্লাসের সার্বক্ষণিক রেকর্ডেড ব্যাকআপ</span>
                </div>
              </div>

              {/* Support Call */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-400 block mb-1">
                  ভর্তি সংক্রান্ত যেকোনো প্রয়োজনে কল করুন:
                </span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
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
