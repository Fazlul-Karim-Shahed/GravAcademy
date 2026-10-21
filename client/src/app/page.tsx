'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
      institution: 'বুয়েট (BUET - CSE)',
      department: 'কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং',
      exp: '৮+ বছরের শিক্ষকতা অভিজ্ঞতা',
      subjects: ['উচ্চতর গণিত', 'পদার্থবিজ্ঞান'],
      badge: 'মাস্টার ট্রেইনার',
      studentsCount: '১৫,০০০+',
      classesCount: '৪৫০+ লাইভ ক্লাস',
      avatarColor: 'from-blue-600 via-indigo-600 to-blue-700',
      initials: 'MH',
    },
    {
      name: 'রফিকুল ইসলাম',
      institution: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
      department: 'ফলিত রসায়ন ও কেমিকৌশল বিভাগ',
      exp: '৬+ বছরের শিক্ষকতা অভিজ্ঞতা',
      subjects: ['রসায়ন', 'সাধারণ বিজ্ঞান'],
      badge: 'বোর্ড স্পেশালিস্ট',
      studentsCount: '১২,০০০+',
      classesCount: '৩৮০+ লাইভ ক্লাস',
      avatarColor: 'from-emerald-600 via-teal-600 to-cyan-700',
      initials: 'RI',
    },
    {
      name: 'তানভীর আহমেদ',
      institution: 'ঢাকা মেডিকেল কলেজ (DMC)',
      department: 'এমবিবিএস (MBBS)',
      exp: '৫+ বছরের শিক্ষকতা অভিজ্ঞতা',
      subjects: ['জীববিজ্ঞান', 'তথ্য ও যোগাযোগ প্রযুক্তি'],
      badge: 'সিনিয়র মেন্টর',
      studentsCount: '১০,০০০+',
      classesCount: '৩২০+ লাইভ ক্লাস',
      avatarColor: 'from-purple-600 via-indigo-600 to-rose-600',
      initials: 'TA',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen selection:bg-blue-600 selection:text-white transition-colors">
      
      {/* 1. TOP ANNOUNCEMENT STRIP */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium shadow-inner flex items-center justify-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[11px] uppercase tracking-wide">
          ভর্তি চলছে
        </span>
        <span>নতুন সেশনের সব ব্যাচে সীমিত আসনে ভর্তি নেওয়া হচ্ছে।</span>
        <Link href="/courses" className="font-bold underline underline-offset-4 hover:text-amber-200 transition-colors ml-1 hidden sm:inline-flex items-center gap-1">
          ব্যাচ রুটিন দেখুন <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50/20 to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950 pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-100 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <h1 className="text-3xl sm:text-5xl lg:text-[44px] font-extrabold text-slate-900 dark:text-white leading-[1.32] tracking-tight">
                পড়ালেখার পূর্ণাঙ্গ প্রস্তুতি হোক{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-400 dark:to-indigo-300">
                  দেশসেরা শিক্ষকদের
                </span>{' '}
                নিবিড় সান্নিধ্যে
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-[1.8] max-w-2xl mx-auto lg:mx-0">
                অভিজ্ঞ শিক্ষকবৃন্দের লাইভ ক্লাস, অধ্যায়ভিত্তিক লেকচার শিট, নিয়মিত মডেল টেস্ট ও সার্বক্ষণিক ডাউট সলভ দিয়ে নিশ্চিত করো তোমার বোর্ড পরীক্ষার সেরা ফলাফল।
              </p>

              {/* Class Selectors Quick Pills */}
              <div className="mt-8 pt-6 border-t border-slate-200/90 dark:border-slate-800/90">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    তোমার শ্রেণি নির্বাচন করো:
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold hidden sm:inline">
                    এক ক্লিকে কোর্স দেখুন
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start">
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
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
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

            </div>

            {/* Right Visual Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-[4/3] sm:aspect-[16/11]">
                  <img
                    src="/images/hero-student.jpg"
                    alt="Bangladeshi student preparing with Grav Academy"
                    className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-500"
                  />
                  {/* High contrast gradient backdrop for crystal clear text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />
                  
                  {/* Clear Glassmorphism Card for Text Contrast */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/15 text-white shadow-xl">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-[11px] font-extrabold tracking-wide uppercase shadow-xs inline-block mb-1 text-white">
                      সফলতার গল্প
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug drop-shadow-md">
                      নিয়মিত অধ্যবসায় ও সেরা গাইডলাইনে অর্জন করো সর্বোচ্চ ফলাফল
                    </h3>
                  </div>
                </div>

                {/* Floating Badge 1: Top Left - perfectly anchored hugging the top-left boundary */}
                <div className="absolute -top-5 left-2 sm:-left-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-xl flex items-center gap-3 z-10">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                    <PlayCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">প্রতি সপ্তাহে</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">১২+ লাইভ ক্লাস</span>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom Right - cleanly positioned at the bottom right corner with slight overlap */}
                <div className="absolute -bottom-5 right-2 sm:-right-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center gap-3 z-10">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
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

      {/* 4. FEATURED COURSES SECTION */}
      <section id="featured-courses" className="py-20 sm:py-24 bg-slate-50/70 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3">
                <BookOpen className="w-3.5 h-3.5" /> কোর্সের তালিকা
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                জনপ্রিয় কোর্স ও ব্যাচসমূহ
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
                তোমার পছন্দের কোর্সে ক্লিক করে বিস্তারিত সিলেবাস ও চলতি ব্যাচের সময়সূচি দেখে নাও।
              </p>
            </div>

            {/* Class Switcher Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {classList.slice(0, 6).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((c) => (
                <Link
                  key={c._id}
                  href={`/courses/${c._id}`}
                  className="group block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Banner */}
                    <div className="p-6 bg-gradient-to-br from-blue-50/50 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-blue-600 text-white shadow-2xs">
                          {c.gradeLevel}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          {c.subject}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 leading-snug">
                        {c.title}
                      </h3>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-[1.7]">
                        {c.description || 'সম্পূর্ণ অধ্যায়ভিত্তিক বিস্তারিত কনসেপ্ট ও বোর্ড প্রশ্ন বিশ্লেষণ কোর্স।'}
                      </p>
                    </div>

                    {/* Features Snippet */}
                    <div className="p-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>লাইভ ক্লাস ও সার্বক্ষণিক ডাউট সলভ</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>লেকচার শিট ও বোর্ড প্রশ্ন সমাধান</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>অধ্যায়ভিত্তিক মডেল টেস্ট ও লিডারবোর্ড</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">কোর্স ফি</span>
                      <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                        ৳ {c.courseFee ? c.courseFee.toLocaleString() : 'ফ্রি'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold group-hover:bg-blue-700 transition-colors shadow-2xs">
                      <span>বিস্তারিত ও ভর্তি</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Catalog CTA */}
          <div className="mt-14 text-center">
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

      {/* 5. VISUAL SECTION 1: LIVE CLASS (Spacious, Clean & Minimal Text) */}
      <section className="py-20 sm:py-28 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
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

            {/* Text on Right (Crisp, spacious 3 bullet points) */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <span className="px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold inline-block mb-4">
                আধুনিক পাঠদান পদ্ধতি
              </span>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-[1.35] tracking-tight">
                ডিজিটাল স্মার্টবোর্ডে জীবন্ত ও প্রাণবন্ত ক্লাস
              </h2>
              
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-[1.8]">
                বইয়ের কঠিন বিষয়গুলো সহজ গ্রাফিক্স ও বাস্তব উদাহরণের মাধ্যমে ক্লাসেই বুঝিয়ে দেওয়া হয়।
              </p>

              {/* 3 Spacious Clean Feature Points */}
              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0 font-bold text-sm shadow-2xs">
                    ১
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">রিয়েল-টাইম ডাউট সলভিং</h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-[1.6]">
                      লাইভ ক্লাসেই সরাসরি প্রশ্ন করে যেকোনো দ্বিধা সমাধান করার সুযোগ।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-sm shadow-2xs">
                    ২
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">বোর্ড প্রশ্ন ও টেস্ট পেপার সলভিং</h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-[1.6]">
                      শীর্ষস্থানীয় কলেজ ও স্কুলের বিগত বছরের প্রশ্নের বিশেষ সমাধান।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-sm shadow-2xs">
                    ৩
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">আনলিমিটেড রেকর্ডেড ক্লাস</h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-[1.6]">
                      পরীক্ষার আগে রিভিশনের জন্য যতবার খুশি ক্লাস দেখার সুযোগ।
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-2">
                <Link
                  href="/live-classes"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>আজকের লাইভ ক্লাস শিডিউল দেখুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 6. VISUAL SECTION 2: STUDY COLLABORATION & EXAM READINESS */}
      <section className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Text on Left */}
            <div className="lg:col-span-6">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-block mb-4">
                শিক্ষার্থী বান্ধব পরিবেশ
              </span>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-[1.35] tracking-tight">
                একসাথে প্রস্তুতি, নিয়মিত পরীক্ষা ও আত্মবিশ্বাস বৃদ্ধি
              </h2>
              
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-[1.8]">
                নিয়মিত সাপ্তাহিক মডেল টেস্ট ও মূল্যায়ন দিয়ে যাচাই করো তোমার প্রস্তুতি।
              </p>

              {/* 2 Big Spacious Highlight Cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center font-bold mb-3">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">রিয়েলটাইম লিডারবোর্ড</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-[1.6]">
                    পরীক্ষার পর সারাদেশে সহপাঠীদের মাঝে নিজের মেধার অবস্থান দেখার সুবিধা।
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">অভিভাবক ট্র্যাকিং</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-[1.6]">
                    ক্লাসের উপস্থিতি ও পরীক্ষার ফলাফল অভিভাবকরা সহজে ট্র্যাক করতে পারেন।
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>ফ্রি স্টুডেন্ট অ্যাকাউন্ট খুলুন</span>
                  <ArrowRight className="w-4 h-4" />
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
                <div className="absolute bottom-5 right-5 bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <Check className="w-4 h-4" />
                  <span>৯৮% সন্তুষ্ট শিক্ষার্থী ও অভিভাবক</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. TEACHERS / FACULTY SECTION (Shikho & 10 Minute School Style Instructor Cards) */}
      <section className="py-20 sm:py-28 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1.5 rounded-full bg-blue-100/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold inline-block mb-3.5 shadow-2xs">
              অভিজ্ঞ শিক্ষক প্যানেল
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              যাদের নিবিড় সান্নিধ্যে তোমার স্বপ্নপূরণ
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
              বুয়েট, ঢাকা বিশ্ববিদ্যালয় ও শীর্ষ মেডিকেল কলেজের অভিজ্ঞ মেন্টরদের নিবিড় তত্ত্বাবধানে বিষয়ভিত্তিক পাঠদান।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {instructorsList.map((teacher, idx) => (
              <div
                key={idx}
                className="group relative bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-2xl hover:border-blue-500/80 dark:hover:border-blue-500/80 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header with Avatar & Badge */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${teacher.avatarColor} text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300`}>
                        {teacher.initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white" title="ভেরিফায়েড শিক্ষক">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-200/80 dark:border-blue-800/80 shrink-0">
                      {teacher.badge}
                    </span>
                  </div>

                  {/* Teacher Name & Elite Academic Institution */}
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {teacher.name}
                  </h3>

                  {/* Institution Highlight (Shikho Signature Tag) */}
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{teacher.institution}</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {teacher.department} • {teacher.exp}
                  </p>

                  {/* Taught Subjects Pills */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      পাঠদানের বিষয়:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.subjects.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/50 dark:border-blue-900/50"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Stats Footer (Shikho / 10MS Credibility Metric) */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{teacher.studentsCount} শিক্ষার্থী</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{teacher.classesCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. 3-STEP ADMISSION PROCESS */}
      <section className="py-20 sm:py-24 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              ভর্তি হতে মাত্র ৩টি ধাপ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              সহজ তিনটি ধাপে ভর্তি হয়ে আজ থেকেই তোমার একাডেমিক পড়াশোনা শুরু করো।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
                ১
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">রেজিস্ট্রেশন করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                নাম ও মোবাইল নম্বর দিয়ে বিনামূল্যে একটি স্টুডেন্ট অ্যাকাউন্ট খুলুন।
              </p>
            </div>

            <div className="text-center p-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-500/20">
                ২
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">কোর্স ও ব্যাচ পছন্দ করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                তোমার পছন্দের শ্রেণি অনুযায়ী কোর্স নির্বাচন করে ব্যাচে ভর্তি সম্পন্ন করুন।
              </p>
            </div>

            <div className="text-center p-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/20">
                ৩
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">ক্লাস শুরু করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                ড্যাশবোর্ড থেকে লাইভ ক্লাস করুন, নোট ডাউনলোড করুন ও নিয়মিত মডেল টেস্ট দিন।
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="py-20 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 inline-block mb-3">
              জিজ্ঞাসা
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              গ্র্যাভ একাডেমিতে ক্লাস, পরীক্ষা এবং ভর্তি সংক্রান্ত যেকোনো তথ্য।
            </p>
          </div>

          <div className="space-y-4">
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
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-[1.8] border-t border-slate-100 dark:border-slate-800/80 mt-1 pt-3.5">
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
      <section className="py-16 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-center">
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
