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
  PlayCircle,
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
      
      {/* 1. COSMIC GLOWING HERO HEADER STRIP (Matching Home & Courses Cosmic Theme) */}
      <div className="relative overflow-hidden cosmic-hero-bg text-white pt-10 pb-12 sm:pt-14 sm:pb-16 mb-8 border-b border-white/10 shadow-lg">
        {/* Deep space radial ambient lighting & celestial nebula glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[380px] bg-gradient-to-b from-rose-950/45 via-red-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[250px] bg-red-600/15 rounded-full blur-[100px] pointer-events-none -z-10 animate-atmosphere" />
        <div className="absolute -top-10 left-1/4 w-[350px] h-[250px] bg-blue-900/15 rounded-full blur-[90px] pointer-events-none -z-10" />
        <div className="absolute -top-10 right-1/4 w-[350px] h-[250px] bg-purple-900/15 rounded-full blur-[90px] pointer-events-none -z-10" />

        {/* Twinkling Cosmic Stars & Shooting Star */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[12%] left-[8%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[22%] left-[16%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
          <div className="absolute top-[10%] right-[14%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
          <div className="absolute top-[28%] right-[8%] w-1.5 h-1.5 rounded-full bg-rose-200 animate-star-twinkle-slow" />
          <div className="absolute top-[35%] left-[45%] w-1 h-1 rounded-full bg-sky-200 animate-star-twinkle-medium" />
          <span className="shooting-star meteor-1" />
          <span className="shooting-star meteor-3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-5">
            <Link
              href="/courses"
              className="hover:text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>সকল কোর্স</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-white font-bold">{className}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-normal leading-[1.35] text-white">
                {className}:{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 pt-1 pb-2 px-1">
                  {subtitle.toLowerCase().includes(className.toLowerCase())
                    ? subtitle.replace(new RegExp(className, 'i'), '').replace(/^[:\-\s]+/, '')
                    : subtitle}
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl font-medium leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#courses-section"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-98 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/30 transition-all border border-white/20"
              >
                <span>কোর্সসমূহ দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

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
              <span>{className}-এর কোর্সসমূহ</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              আপনার পছন্দের কোর্সটি বেছে নিয়ে ক্লাসরুমে যুক্ত হোন
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {courses.map((c, idx) => {
              const cardThemes = [
                {
                  gradient: 'from-violet-600 via-indigo-600 to-purple-800',
                  tag: 'text-violet-200',
                },
                {
                  gradient: 'from-emerald-600 via-teal-600 to-cyan-800',
                  tag: 'text-teal-200',
                },
                {
                  gradient: 'from-blue-600 via-indigo-600 to-sky-900',
                  tag: 'text-sky-200',
                },
                {
                  gradient: 'from-rose-600 via-pink-600 to-purple-900',
                  tag: 'text-rose-200',
                },
                {
                  gradient: 'from-amber-600 via-orange-600 to-rose-900',
                  tag: 'text-amber-200',
                },
              ];

              const currentTheme = cardThemes[idx % cardThemes.length];

              return (
                <Link
                  key={c._id}
                  href={`/courses/${c.slug || c._id}`}
                  className="cute-course-card group rounded-[34px] overflow-hidden flex flex-col justify-between p-2.5 sm:p-3 border-2 border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/70 dark:hover:border-purple-500/70 transition-all duration-300"
                >
                  <div>
                    {/* Top Thumbnail Banner with Smooth Curved Mask */}
                    <div className="relative w-full aspect-[16/9.5] rounded-[26px] overflow-hidden border border-slate-200/60 dark:border-white/10 shadow-sm">
                      <div className={`relative w-full h-full ${c.thumbnailUrl ? 'bg-slate-900' : `bg-gradient-to-br ${currentTheme.gradient}`}`}>
                        {c.thumbnailUrl ? (
                          <img
                            src={c.thumbnailUrl}
                            alt={c.title}
                            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <BookOpen className="w-12 h-12 text-white/80 drop-shadow-md mb-2 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-white font-black text-sm drop-shadow-md tracking-wide px-3">
                              {c.title}
                            </span>
                          </div>
                        )}

                        {/* Gloss Sheen Shine Across Thumbnail */}
                        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-card-sheen" />

                        {/* Top Badges Overlay */}
                        <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
                          {/* Grade Level Tag */}
                          <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black border border-white/25 shadow-md flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>{c.gradeLevel || className}</span>
                          </span>

                          {/* Cute Live Indicator */}
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-[11px] font-black shadow-md border border-slate-200/60 dark:border-white/15">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                              <span className="relative m-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                            </span>
                            <span>লাইভ ব্যাচ</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="px-3.5 sm:px-4 pb-3 pt-3.5">
                      {/* Course Title */}
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {c.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed mt-1.5 overflow-hidden">
                        {c.description
                          ? c.description.length > 55
                            ? c.description.slice(0, 55).trim() + '...'
                            : c.description
                          : 'সম্পূর্ণ অধ্যায়ভিত্তিক বিস্তারিত কনসেপ্ট ও বোর্ড প্রস্তুতির কোর্স।'}
                      </p>

                      {/* Cute Feature Micro-Badges */}
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <PlayCircle className="w-3.5 h-3.5" />
                          </div>
                          <span className="line-clamp-1">লাইভ ক্লাস ও সার্বক্ষণিক ডাউট সলভ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span className="line-clamp-1">অধ্যায়ভিত্তিক লেকচার শিট ও নোট</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <span className="line-clamp-1">অনলাইন উইকলি টেস্ট ও এনালাইসিস</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cute Card Bottom: Pricing & Course Details CTA */}
                  <div className="p-3.5 sm:p-4 mt-1 rounded-[24px] border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shadow-inner">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                        ভর্তি চলছে
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        {c.discountPrice && c.discountPrice > 0 && c.regularPrice && c.regularPrice > c.discountPrice ? (
                          <>
                            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                              ৳{c.discountPrice}
                            </span>
                            <span className="text-[11px] text-slate-400 line-through font-semibold">
                              ৳{c.regularPrice}
                            </span>
                          </>
                        ) : c.regularPrice || c.courseFee ? (
                          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                            ৳{c.regularPrice || c.courseFee}
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                            ব্যাচভিত্তিক ফি
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cute Action Button: কোর্স বিস্তারিত */}
                    <div className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 group-hover:from-blue-700 group-hover:to-purple-700 text-white font-black text-xs shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/35 transition-all flex items-center gap-1.5 shrink-0 group-hover:scale-102">
                      <span>কোর্স বিস্তারিত</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
