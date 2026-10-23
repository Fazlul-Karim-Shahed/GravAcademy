'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Users,
  Compass,
  Layers,
  ChevronRight,
  ArrowLeft,
  Clock,
  Award,
  Video,
  FileText,
} from 'lucide-react';
import {
  getSharedAcademicClasses,
  AcademicClassItem,
  getClassSlug,
} from '@/lib/classes';

export default function DedicatedClassPage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = (params?.slug as string) || '';

  const [academicClass, setAcademicClass] = useState<AcademicClassItem | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<AcademicClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassData();
  }, [slugParam]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all classes for quick switching tabs
      const classList = await getSharedAcademicClasses();
      setAllClasses(classList);

      // Find locally first or via API
      const matchedLocal = classList.find(
        (c) =>
          getClassSlug(c).toLowerCase() === slugParam.toLowerCase() ||
          c.name.toLowerCase() === slugParam.replace(/-/g, ' ').toLowerCase() ||
          c._id === slugParam
      );

      // 2. Try fetching from backend /classes/:idOrSlug
      let backendData: any = null;
      try {
        const res = await api.get(`/classes/${slugParam}`);
        if (res.data?.success && res.data.data) {
          backendData = res.data.data;
        }
      } catch (e) {
        // Fallback silently if API not yet populated or offline
      }

      if (backendData?.academicClass) {
        setAcademicClass(backendData.academicClass);
        setCourses(backendData.courses || []);
      } else if (matchedLocal) {
        setAcademicClass(matchedLocal);
        // Fetch courses for this grade level
        try {
          const coursesRes = await api.get('/courses', {
            params: { gradeLevel: matchedLocal.name, isPublished: true },
          });
          if (coursesRes.data?.success) {
            setCourses(coursesRes.data.data || []);
          }
        } catch (err) {
          console.warn('Courses fetch error:', err);
        }
      } else {
        // Fallback default
        setAcademicClass({
          _id: 'default',
          name: slugParam.replace(/-/g, ' ').toUpperCase(),
          order: 1,
          description: 'এই শ্রেণির সকল একাডেমিক কোর্স ও কারিকুলাম তালিকা।',
        });
      }
    } catch (err) {
      console.error('Failed to load class page data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            ক্লাসের তথ্য লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  const className = academicClass?.name || 'Class';
  const subtitle =
    academicClass?.subtitle ||
    `${className}-এর শিক্ষার্থীদের জন্য পরিকল্পিত পূর্ণাঙ্গ একাডেমিক প্রোগ্রাম`;
  const description =
    academicClass?.description ||
    'নতুন কারিকুলাম ও বোর্ড সিলেবাসের সাথে সামঞ্জস্য রেখে সর্বোচ্চ প্রস্তুতি নিশ্চিতকরণ।';
  const highlights = academicClass?.curriculumHighlights && academicClass.curriculumHighlights.length > 0
    ? academicClass.curriculumHighlights
    : [
        'অধ্যায়ভিত্তিক লাইভ ইন্টারঅ্যাক্টিভ ক্লাস',
        'স্ট্যান্ডার্ড লেকচার শিট ও স্মার্ট নোটস',
        'সাপ্তাহিক ও মাসিক মেগা মডেল টেস্ট',
        'নিয়মিত প্রোগ্রেস ট্র্যাকিং ও গার্ডিয়ান মনিটরিং',
      ];
  const features = academicClass?.features && academicClass.features.length > 0
    ? academicClass.features
    : [
        {
          title: 'অভিজ্ঞ মেন্টর প্যানেল',
          description: 'শীর্ষস্থানীয় বিশ্ববিদ্যালয় ও বোর্ডের অভিজ্ঞ শিক্ষকদের প্রত্যক্ষ তত্ত্বাবধান।',
        },
        {
          title: 'গোছানো কারিকুলাম',
          description: 'বোর্ড সিলেবাসের প্রতিটি অধ্যায়ের মৌলিক থিওরি ও অনুশীলনী সমাধান।',
        },
        {
          title: '২৪/৭ ডাউট ক্লিয়ারিং',
          description: 'পড়াশোনায় যেকোনো জটিলতায় সার্বক্ষণিক গ্রুপ ও ফোরাম সহায়তা।',
        },
      ];
  const faqs = academicClass?.faqs && academicClass.faqs.length > 0
    ? academicClass.faqs
    : [
        {
          question: 'ক্লাসগুলো কোন সময়ে অনুষ্ঠিত হয়?',
          answer: 'শিক্ষার্থীদের স্কুলের সময়ের সাথে সমন্বয় করে সুবিধাজনক সময়ে (প্রধানত বিকেলে বা সন্ধ্যায়) ক্লাস অনুষ্ঠিত হয়।',
        },
        {
          question: 'লাইভ ক্লাস মিস হলে কী করব?',
          answer: 'প্রত্যেকটি লাইভ ক্লাসের পরদিন ক্লাসরুম পোর্টালে সম্পূর্ণ ফুল এইচডি রেকর্ডিং ও লেকচার নোটস সংরক্ষিত থাকে।',
        },
      ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-20">
      
      {/* 1. Hero Section with Cosmic Glow Background */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pb-20 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-10 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumb & Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/courses" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>সকল কোর্স</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 dark:text-white font-bold">{className}</span>
            </div>

            {/* Quick Switch Classes Pill Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {allClasses.map((c) => {
                const s = getClassSlug(c);
                const isActive = s.toLowerCase() === slugParam.toLowerCase() || c.name.toLowerCase() === className.toLowerCase();
                return (
                  <Link
                    key={c._id}
                    href={`/classes/${s}`}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                    }`}
                  >
                    {c.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Hero Content */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4 shadow-xs">
              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>একাডেমিক কেয়ার প্রোগ্রাম</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              {className}: {subtitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-6">
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#courses-section"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-600/25 transition-all"
              >
                <span>কোর্সসমূহ দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/free-classes"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold shadow-xs transition-all"
              >
                <Video className="w-4 h-4 text-emerald-500" />
                <span>ফ্রি ডেমো ক্লাস</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Curriculum Highlights & Syllabus Strategy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Curriculum Plan */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 sm:p-8 rounded-[28px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/90 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {className} কারিকুলাম ও পাঠ্যক্রম হাইলাইটস
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    এই ক্লাসের জন্য আমাদের সুনির্দিষ্ট শিক্ষণ পদ্ধতি
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-[24px] bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-blue-400 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Quick Class Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-[28px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full inline-block">
                  একাডেমিক এডভাইজরি
                </span>
                <h3 className="text-xl font-black">
                  {className}-এ পড়াশোনার ব্যাপারে কোনো জিজ্ঞাসা আছে?
                </h3>
                <p className="text-xs text-blue-100 font-medium leading-relaxed">
                  আমাদের একাডেমি কাউন্সেলরের সাথে সরাসরি কথা বলে আপনার সন্তানের জন্য সঠিক কোর্স বা ব্যাচটি বেছে নিন।
                </p>
                <div className="pt-2">
                  <a
                    href="tel:01700000000"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white text-blue-700 text-xs font-black shadow-md hover:bg-blue-50 active:scale-98 transition-all"
                  >
                    <span>কাউন্সেলরের সাথে কথা বলুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="p-6 rounded-[28px] bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200/90 dark:border-slate-800/90 shadow-md space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>সচরাচর জিজ্ঞাসা (FAQ)</span>
              </h4>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {faq.question}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Available Courses for this Class */}
      <section id="courses-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                <Layers className="w-4 h-4" />
              </div>
              <span>{className}-এর কোর্স ও ব্যাচসমূহ</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              আপনার পছন্দের কোর্সটি বেছে নিয়ে ক্লাসরুমে এনরোল করুন
            </p>
          </div>
          <Link
            href="/courses"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>অন্যান্য শ্রেণির কোর্স দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="p-12 text-center rounded-[28px] bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800/90 max-w-md mx-auto shadow-sm">
            <Compass className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              এই মুহূর্তে {className}-এর কোনো কোর্স নেই
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              শীঘ্রই নতুন ব্যাচ ও কোর্সের ঘোষণা দেওয়া হবে। সকল কোর্স দেখতে নিচের বাটনে ক্লিক করুন।
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>সকল কোর্স দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course._id}
                className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-50/60 via-white/95 to-indigo-50/50 dark:from-slate-900/95 dark:via-[#0c1228]/95 dark:to-indigo-950/30 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500/70 shadow-md hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-indigo-500/10 transition-all duration-300"
              >
                {/* Ambient Color Glow Orbs */}
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
                      {course.gradeLevel || className}
                    </span>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      {course.courseFee ? `৳${course.courseFee}` : 'ফ্রি'}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium leading-relaxed">
                    {course.description}
                  </p>

                  {/* Highlights if any */}
                  {course.curriculumHighlights && course.curriculumHighlights.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {course.curriculumHighlights.slice(0, 2).map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="relative z-10 pt-4 mt-4 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
                  <Link
                    href={`/courses/${course._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>কোর্স বিস্তারিত</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/courses/${course._id}`}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition-all"
                  >
                    এনরোল করুন
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
