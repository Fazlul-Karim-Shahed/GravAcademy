'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  PlayCircle,
  FileText,
  CheckCircle2,
  Users,
  Video,
  ChevronRight,
  Award,
  PhoneCall,
  Clock,
  ShieldCheck,
  ChevronDown,
  Layers,
  Star,
  Check,
  Calendar,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  gradeLevel: string;
  subject: string;
  courseFee: number;
  duration?: string;
  batchCount?: number;
  instructors?: any[];
  curriculumHighlights?: string[];
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const classList = ['All', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const res = await api.get('/courses', { params: { isPublished: true } });
      if (res.data?.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load courses on homepage', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const filteredCourses =
    selectedClass === 'All'
      ? courses
      : courses.filter((c) => c.gradeLevel.toLowerCase() === selectedClass.toLowerCase());

  const faqs = [
    {
      q: 'গ্র্যাভ একাডেমিতে ক্লাস কীভাবে পরিচালিত হয়?',
      a: 'আমাদের প্রতিটি কোর্সে রুটিন অনুযায়ী লাইভ ক্লাস নেওয়া হয়। লাইভ ক্লাস শেষ হওয়ার সাথে সাথেই হাই-ডেফিনিশন রেকর্ডেড ক্লাস স্টুডেন্ট ড্যাশবোর্ডে যুক্ত হয়ে যায়, যাতে শিক্ষার্থীরা যেকোনো সময় রিভিশন দিতে পারে।',
    },
    {
      q: 'ক্লাসের নোটস বা লেকচার শিট কীভাবে পাওয়া যাবে?',
      a: 'প্রতিটি অধ্যায়ের কনসেপ্ট শিট, ফর্মুলা বুকলেট ও বিগত বছরের প্রশ্ন সমাধানের পিডিএফ সরাসরি স্টুডেন্ট পোর্টাল ও গুগল ড্রাইভ থেকে এক ক্লিকেই সহজে ডাউনলোড করা যায়।',
    },
    {
      q: 'কোনো বিষয়ে পড়া বুঝতে সমস্যা হলে বা ডাউট থাকলে কীভাবে সমাধান পাব?',
      a: 'লাইভ ক্লাসে সরাসরি শিক্ষকদের প্রশ্ন করার সুযোগ রয়েছে। এছাড়া কোর্সে এনরোল্ড শিক্ষার্থীদের জন্য সার্বক্ষণিক ডেডিকেটেড ডাউট-সলভিং সাপোর্ট ও সাপ্তাহিক বিশেষ রিভিশন ক্লাস অনুষ্ঠিত হয়।',
    },
    {
      q: 'পরীক্ষা বা মডেল টেস্টের মূল্যায়ন কীভাবে করা হয়?',
      a: 'প্রতিটি চ্যাপ্টার শেষে অটোমেটেড অনলাইন এমসিকিউ (MCQ) এবং বোর্ড স্ট্যান্ডার্ড রিটেন পরীক্ষা নেওয়া হয়। পরীক্ষা শেষেই শিক্ষার্থী তার প্রাপ্ত নম্বর, বিস্তারিত ব্যাখ্যা এবং মেধা তালিকা দেখতে পায়।',
    },
    {
      q: 'কোর্সে কীভাবে ভর্তি বা ফি পেমেন্ট করব?',
      a: 'কোর্সের "বিস্তারিত ও ভর্তি" বাটনে ক্লিক করে যেকোনো উপযুক্ত ব্যাচ নির্বাচন করে বিকাশ, নগদ বা কার্ডের মাধ্যমে সম্পূর্ণ অনলাইনে ভর্তি সম্পন্ন করা যায়।',
    },
  ];

  const instructorsList = [
    {
      name: 'মাহমুদুল হাসান',
      title: 'হেড অফ একাডেমিক কেয়ার',
      exp: 'বুয়েট (CSE) • ৮+ বছরের শিক্ষকতা অভিজ্ঞতা',
      subject: 'উচ্চতর গণিত ও পদার্থবিজ্ঞান',
      badge: 'মাস্টার ট্রেইনার',
    },
    {
      name: 'রফিকুল ইসলাম',
      title: 'সিনিয়র ইনস্ট্রাক্টর',
      exp: 'ঢাকা বিশ্ববিদ্যালয় (রসায়ন বিভাগ) • ৬+ বছর অভিজ্ঞতা',
      subject: 'রসায়ন ও সাধারণ বিজ্ঞান',
      badge: 'বোর্ড স্পেশালিস্ট',
    },
    {
      name: 'তানভীর আহমেদ',
      title: 'সিনিয়র ফ্যাকাল্টি',
      exp: 'মেডিকেল ব্যাকগ্রাউন্ড • ৫+ বছর শিক্ষকতা অভিজ্ঞতা',
      subject: 'জীববিজ্ঞান ও আইসিটি',
      badge: 'মেন্টর',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen selection:bg-blue-600 selection:text-white transition-colors">
      
      {/* 1. TOP NOTICE / ADMISSION ANNOUNCEMENT */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-xs sm:text-sm py-2.5 px-4 text-center font-medium shadow-inner flex items-center justify-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[11px] uppercase tracking-wide">
          ভর্তি চলছে
        </span>
        <span>নতুন সেশনের সব ব্যাচে সীমিত আসনে ভর্তি নেওয়া হচ্ছে।</span>
        <Link href="/courses" className="font-bold underline underline-offset-4 hover:text-amber-200 transition-colors ml-1 hidden sm:inline-flex items-center gap-1">
          ব্যাচ রুটিন দেখুন <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. HERO SECTION WITH AUTHENTIC BANGLADESHI STUDENT PHOTO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50/30 to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950 pt-10 pb-16 lg:pt-16 lg:pb-20 border-b border-slate-100 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/90 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/70 text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-semibold mb-5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>ক্লাস ৬ থেকে ১২ শ্রেণির সম্পূর্ণ অনলাইন একাডেমিক কেয়ার</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[46px] font-extrabold text-slate-900 dark:text-white leading-[1.28] tracking-tight">
                পড়ালেখার পূর্ণাঙ্গ প্রস্তুতি হোক{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-400 dark:to-indigo-300">
                  দেশসেরা শিক্ষকদের
                </span>{' '}
                নিবিড় সান্নিধ্যে
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                লাইভ ক্লাস, অধ্যায়ভিত্তিক প্রিমিয়াম লেকচার শিট, নিয়মিত মডেল টেস্ট এবং তাৎক্ষণিক ডাউট সলভ দিয়ে নিশ্চিত করো তোমার বোর্ড পরীক্ষার জিপিএ-৫।
              </p>

              {/* Class Selectors Quick Pills (10 Minute School Style) */}
              <div className="mt-7 pt-6 border-t border-slate-200/90 dark:border-slate-800/90">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    তোমার শ্রেণি নির্বাচন করো:
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold hidden sm:inline">
                    ক্লিক করে কোর্স দেখুন
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {classList.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => {
                        setSelectedClass(cls);
                        const el = document.getElementById('featured-courses');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs ${
                        selectedClass === cls
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      {cls === 'All' ? 'সকল কোর্স' : cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href="/courses"
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 group"
                >
                  <span>কোর্স ও ব্যাচ তালিকা</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/live-classes"
                  className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-300 dark:border-slate-800 transition-all shadow-xs flex items-center gap-2"
                >
                  <Video className="w-4 h-4 text-rose-500" />
                  <span>লাইভ ক্লাসের রুটিন</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>বোর্ড সিলেবাস ১০০% কভার</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>রেকর্ডেড ব্যাকআপ ক্লাস</span>
                </div>
                <div className="flex items-center gap-1.5 hidden sm:flex">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>প্রিমিয়াম হ্যান্ডনোটস</span>
                </div>
              </div>

            </div>

            {/* Right Visual Image Card (Real Student Photography with Overlay Stats) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                
                {/* Decorative border frame */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-[4/3] sm:aspect-[16/11]">
                  <img
                    src="/images/hero-student.jpg"
                    alt="Bangladeshi student preparing with Grav Academy"
                    className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  {/* Photo Caption Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-[11px] font-bold tracking-wide uppercase shadow-xs">
                      সফলতার গল্প
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 drop-shadow-sm leading-snug">
                      নিয়মিত অধ্যবসায় ও সেরা গাইডলাইনে অর্জন করো সর্বোচ্চ ফলাফল
                    </h3>
                  </div>
                </div>

                {/* Floating Badge 1: Live Interactive Badge */}
                <div className="absolute -top-4 -left-3 sm:-left-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold shrink-0">
                    <PlayCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">প্রতি সপ্তাহে</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">১২+ লাইভ ক্লাস</span>
                  </div>
                </div>

                {/* Floating Badge 2: PDF Notes Badge */}
                <div className="absolute -bottom-4 -right-2 sm:-right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">লেকচার শিট</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">ফ্রি হ্যান্ডনোট পিডিএফ</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. KEY METRICS STRIP */}
      <section className="bg-slate-900 text-white py-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">১০,০০০+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">নিবন্ধিত শিক্ষার্থী</div>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">৫০০+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">রেকর্ডেড লেকচার ও ক্লাস</div>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">১০০%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">সিলেবাস ও টেস্ট পেপার</div>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">২৪/৭</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">মেন্টরশিপ ও ডাউট সলভ</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED COURSES SECTION (Direct Clickable Cards with Rich Details) */}
      <section id="featured-courses" className="py-16 sm:py-20 bg-slate-50/70 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2.5">
                <BookOpen className="w-3.5 h-3.5" /> কোর্সের তালিকা
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                জনপ্রিয় কোর্স ও ব্যাচসমূহ
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
                তোমার পছন্দের ক্লাসের কোর্সে ক্লিক করে বিস্তারিত সিলেবাস, শিক্ষক পরিচিতি ও চলতি ব্যাচের তালিকা দেখে নাও।
              </p>
            </div>

            {/* Class Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {classList.slice(0, 6).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs ${
                    selectedClass === cls
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cls === 'All' ? 'সকল শ্রেণি' : cls}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Grid */}
          {loadingCourses ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-medium">কোর্সগুলো লোড হচ্ছে...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md mx-auto">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">কোনো কোর্স পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">এই শ্রেণির জন্য নতুন কোর্স ও ব্যাচ শীঘ্রই যুক্ত করা হচ্ছে।</p>
              <button
                onClick={() => setSelectedClass('All')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                সব কোর্স দেখুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => (
                <Link
                  key={c._id}
                  href={`/courses/${c._id}`}
                  className="group block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Banner */}
                    <div className="p-5 bg-gradient-to-br from-blue-50/50 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-blue-600 text-white shadow-2xs">
                          {c.gradeLevel}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          {c.subject}
                        </span>
                      </div>
                      
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 leading-snug">
                        {c.title}
                      </h3>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {c.description || 'সম্পূর্ণ অধ্যায়ভিত্তিক বিস্তারিত কনসেপ্ট ও বোর্ড প্রশ্ন বিশ্লেষণ কোর্স।'}
                      </p>
                    </div>

                    {/* Features Snippet */}
                    <div className="p-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>ইন্টারঅ্যাক্টিভ লাইভ ও ব্যাকআপ ক্লাস</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>অধ্যায়ভিত্তিক লেকচার শিট ও ফর্মুলা বুক</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>সাপ্তাহিক মডেল টেস্ট ও অটোমেটেড মূল্যায়ন</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">কোর্স ফি</span>
                      <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                        ৳ {c.courseFee ? c.courseFee.toLocaleString() : 'ফ্রি'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold group-hover:bg-blue-700 transition-colors shadow-2xs">
                      <span>বিস্তারিত ও ভর্তি</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Catalog CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-900 dark:text-white font-bold text-sm shadow-xs hover:shadow-md transition-all"
            >
              <span>সকল কোর্স ও ব্যাচ ক্যাটালগ দেখুন</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. VISUAL SECTION 1: LIVE CLASS EXPERIENCE (Interactive Digital Studio) */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Image on Left */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-[16/10]">
                <img
                  src="/images/live-class.jpg"
                  alt="Teacher conducting live class on digital interactive smartboard"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-4 left-4 bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>লাইভ স্টুডিও ক্লাস</span>
                </div>
              </div>
            </div>

            {/* Text on Right */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                আধুনিক পাঠদান পদ্ধতি
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 leading-snug">
                ডিজিটাল স্মার্টবোর্ডে জীবন্ত ও প্রাণবন্ত ক্লাস
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                বইয়ের কঠিন বিষয়গুলো সহজভাবে বোঝাতে ব্যবহার করা হয় ডিজিটাল গ্রাফিক্স, থ্রিডি অ্যানিমেশন এবং বাস্তব উদাহরণ। ক্লাসেই শিক্ষকের সাথে সরাসরি প্রশ্ন করে সব দ্বিধা দূর করার সুযোগ রয়েছে।
              </p>

              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ১
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">রিয়েল-টাইম ডাউট সলভিং</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">লাইভ ক্লাসেই অডিও বা চ্যাটের মাধ্যমে শিক্ষককে সরাসরি প্রশ্ন করে সমাধান পাওয়ার সুযোগ।</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ২
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">বোর্ড পরীক্ষার টেস্ট পেপার সলভিং</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">বিগত ১০ বছরের শীর্ষস্থানীয় স্কুল ও কলেজের প্রশ্ন ও ক্রিয়েটিভ প্রশ্নের নিখুঁত সলিউশন।</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ৩
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">আনলিমিটেড রেকর্ডেড রিভিশন</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">পরীক্ষার আগের দিন রাতেও সম্পূর্ণ ক্লাসের হাই-কোয়ালিটি ভিডিও দেখে রিভিশন দেওয়া যায়।</p>
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <Link
                  href="/live-classes"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  <span>আজকের লাইভ ক্লাস শিডিউল দেখুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 6. VISUAL SECTION 2: STUDY COLLABORATION & EXAM READINESS */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Text on Left */}
            <div className="lg:col-span-6">
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                শিক্ষার্থী বান্ধব পরিবেশ
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 leading-snug">
                একসাথে প্রস্তুতি, নিয়মিত এক্সাম ও আত্মবিশ্বাস বৃদ্ধি
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                শুধু পড়া শুনলেই হয় না, নিজে কতটুকু শিখতে পারলে তা যাচাই করা সবচেয়ে জরুরি। আমাদের প্ল্যাটফর্মে রয়েছে নিয়মিত সাপ্তাহিক মডেল টেস্ট, চ্যাপ্টার কুইজ এবং লিডারবোর্ড।
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <Award className="w-6 h-6 text-amber-500 mb-2" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">রিয়েলটাইম লিডারবোর্ড</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    অনলাইন পরীক্ষার পর সারা দেশের সহপাঠীদের মাঝে তোমার মেধার অবস্থান যাচাই।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">অভিভাবক ট্র্যাকিং</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    শিক্ষার্থীর উপস্থিতি, ক্লাসের অগ্রগতি ও পরীক্ষার ফলাফল অভিভাবকরা দেখতে পারবেন।
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs shadow-md transition-all"
                >
                  <span>ফ্রি স্টুডেন্ট অ্যাকাউন্ট খুলুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Image on Right */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-[16/10]">
                <img
                  src="/images/group-study.jpg"
                  alt="Students happily collaborating and checking high exam scores"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute bottom-4 right-4 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <Check className="w-3.5 h-3.5" />
                  <span>৯৮% সন্তুষ্ট অভিভাবক ও শিক্ষার্থী</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. TEACHERS / FACULTY SECTION */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
              দক্ষ শিক্ষক প্যানেল
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              যাদের সান্নিধ্যে তোমার স্বপ্নপূরণ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              বুয়েট, ঢাবি এবং শীর্ষ বিশ্ববিদ্যালয়ের অভিজ্ঞ শিক্ষকেরা নিবিড় যত্ন দিয়ে গড়ে তুলবেন তোমার প্রতিটি বিষয়ের ভিত্তি।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {instructorsList.map((teacher, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md">
                      {teacher.name.slice(0, 2)}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                      {teacher.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{teacher.name}</h3>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">{teacher.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{teacher.exp}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">বিষয়:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{teacher.subject}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. 3-STEP ADMISSION PROCESS */}
      <section className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              ভর্তি হতে মাত্র ৩টি ধাপ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              সহজ তিনটি ধাপে ভর্তি হয়ে আজ থেকেই তোমার একাডেমিক পড়াশোনা শুরু করো।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
                ১
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">রেজিস্ট্রেশন করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                নাম ও মোবাইল নম্বর দিয়ে বিনামূল্যে একটি স্টুডেন্ট অ্যাকাউন্ট খুলুন।
              </p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-500/20">
                ২
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">কোর্স ও ব্যাচ পছন্দ করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                তোমার পছন্দের শ্রেণি অনুযায়ী কোর্স নির্বাচন করে ব্যাচে ভর্তি সম্পন্ন করুন।
              </p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/20">
                ৩
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">ক্লাস শুরু করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                ড্যাশবোর্ড থেকে লাইভ ক্লাস করুন, নোট ডাউনলোড করুন ও নিয়মিত মডেল টেস্ট দিন।
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
              জিজ্ঞাসা
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              গ্র্যাভ একাডেমিতে ক্লাস, পরীক্ষা এবং ভর্তি সংক্রান্ত যেকোনো তথ্য।
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 mt-1 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 10. BOTTOM BANNER */}
      <section className="py-14 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            আজই শুরু হোক তোমার সেরা প্রস্তুতি!
          </h2>
          <p className="mt-3 text-blue-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            কোনো প্রকার সংশয় ছাড়া এখনই বিনামূল্যে রেজিস্টার করে সিলেবাস ও লাইভ ক্লাস রুটিন দেখে নাও।
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm shadow-lg transition-all"
            >
              বিনামূল্যে অ্যাকাউন্ট খুলুন
            </Link>
            <Link
              href="/courses"
              className="px-6 py-3.5 rounded-xl bg-blue-800/80 hover:bg-blue-800 text-white border border-blue-400/40 font-bold text-sm transition-all"
            >
              সকল কোর্স দেখুন
            </Link>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-white font-extrabold text-base mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span>Grav Academy</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-4">
                ক্লাস ৬ থেকে ১২ শ্রেণির শিক্ষার্থীদের জন্য আধুনিক অনলাইন একাডেমিক কোচিং প্ল্যাটফর্ম।
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3">কোর্সসমূহ</h4>
              <ul className="space-y-2">
                <li><Link href="/courses" className="hover:text-white transition-colors">Class 6 - 8 Foundation</Link></li>
                <li><Link href="/courses" className="hover:text-white transition-colors">Class 9 - 10 SSC Special</Link></li>
                <li><Link href="/courses" className="hover:text-white transition-colors">Class 11 - 12 HSC Prep</Link></li>
                <li><Link href="/live-classes" className="hover:text-white transition-colors">লাইভ ক্লাস শিডিউল</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3">কুইক লিংকস</h4>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-white transition-colors">লগইন</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">রেজিস্ট্রেশন</Link></li>
                <li><Link href="/exams/take" className="hover:text-white transition-colors">অনলাইন এক্সাম</Link></li>
                <li><Link href="/courses" className="hover:text-white transition-colors">সকল ব্যাচ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3">যোগাযোগ ও হেল্পলাইন</h4>
              <p className="leading-relaxed mb-2">সকাল ৯টা থেকে রাত ১০টা পর্যন্ত যেকোনো সহায়তায়:</p>
              <p className="text-white font-bold text-sm">📞 16910 / 01700-000000</p>
              <p className="text-slate-400 mt-1">ইমেইল: support@gravacademy.com</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-2">
            <div>© {new Date().getFullYear()} Grav Academy. সর্বস্বত্ব সংরক্ষিত।</div>
            <div>Bangladeshi Academic Coaching Platform</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
