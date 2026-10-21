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
  HelpCircle,
  ChevronDown,
  Layers,
  Star,
  Search,
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

  const filteredCourses = selectedClass === 'All' 
    ? courses 
    : courses.filter((c) => c.gradeLevel.toLowerCase() === selectedClass.toLowerCase());

  const faqs = [
    {
      q: 'গ্র্যাভ একাডেমিতে ক্লাস কীভাবে পরিচালনা করা হয়?',
      a: 'আমাদের প্রতিটি কোর্সে লাইভ ক্লাস এবং ইন্টারঅ্যাক্টিভ রেকর্ডেড ক্লাস উভয় সুবিধাই রয়েছে। অভিজ্ঞ শিক্ষকদের ক্লাস শেষে নিয়মিত কনসেপ্ট শিট এবং প্র্যাকটিস এক্সাম নেওয়া হয়।',
    },
    {
      q: 'অনলাইন লাইভ ক্লাসে অংশ নিতে কী কী প্রয়োজন?',
      a: 'একটি স্মার্টফোন, ল্যাপটপ বা কম্পিউটার এবং স্থিতিশীল ইন্টারনেট সংযোগ। গুগল মিট বা আমাদের নিজস্ব ইন্টিগ্রেটেড লাইভ প্ল্যাটফর্মের মাধ্যমে সরাসরি প্রশ্ন করে ক্লাস করা যায়।',
    },
    {
      q: 'ক্লাসের নোট বা লেকচার শিট কীভাবে পাওয়া যাবে?',
      a: 'প্রতিটি অধ্যায় শেষেই ক্লাসের হ্যান্ডনোট, ফর্মুলা শিট এবং লেকচার স্লাইড সরাসরি ড্রাইভ এবং ড্যাশবোর্ড থেকে ডাউনলোড করে পড়ার সুযোগ পাবেন।',
    },
    {
      q: 'কোনো ক্লাস মিস হলে কীভাবে ব্যাকআপ পাব?',
      a: 'প্রতিটি লাইভ ক্লাসের পরপরই এইচডি (HD) কোয়ালিটিতে রেকর্ডেড ভিডিও লেকচার স্টুডেন্ট পোর্টালে যুক্ত হয়। আপনি যেকোনো সময় সুবিধামতো যতবার ইচ্ছা দেখে নিতে পারবেন।',
    },
    {
      q: 'পরীক্ষা বা মূল্যায়ন কীভাবে নেওয়া হয়?',
      a: 'সাপ্তাহিক ও মাসিক অধ্যায়ভিত্তিক অনলাইন এমসিকিউ (MCQ) এবং রিটেন পরীক্ষা নেওয়া হয়। সাথে সাথেই অটোমেটেড রেজাল্ট, মেধার অবস্থান এবং বিস্তারিত সলিউশন দেওয়া হয়।',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors">
      
      {/* 1. HERO SECTION (10 Minute School Style: Headline + Class Selectors + Trust Badges) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-slate-900/80 dark:via-slate-950 dark:to-slate-950 pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-100 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold mb-5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>ক্লাস ৬ থেকে ১২ শ্রেণির সম্পূর্ণ একাডেমিক সমাধান</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25]">
                পড়ালেখার সেরা প্রস্তুতি হোক{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
                  গ্র্যাভ একাডেমির
                </span>{' '}
                সাথে
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                অভিজ্ঞ শিক্ষকদের লাইভ ক্লাস, অধ্যায়ভিত্তিক লেকচার শিট, সময়োপযোগী পরীক্ষা এবং সার্বক্ষণিক ডাউট সলভ নিয়ে প্রস্তুত তোমার বোর্ড পরীক্ষার চূড়ান্ত ফলাফল।
              </p>

              {/* Class Selectors Bar (10 Minute School Quick Picker) */}
              <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
                  তোমার শ্রেণি নির্বাচন করো:
                </span>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {classList.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => {
                        setSelectedClass(cls);
                        const el = document.getElementById('courses-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs ${
                        selectedClass === cls
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {cls === 'All' ? 'সব কোর্স' : cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/courses"
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 group"
                >
                  <span>কোর্সগুলো দেখুন</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/live-classes"
                  className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-800 transition-all shadow-xs flex items-center gap-2"
                >
                  <Video className="w-4 h-4 text-rose-500" />
                  <span>লাইভ ক্লাস শিডিউল</span>
                </Link>
              </div>

            </div>

            {/* Right Card / Visual Banner */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow Backdrop */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-20 dark:opacity-40 animate-pulse" />
                
                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                  <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Grav Academy LMS</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Class 6 to 12 Academic Care</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                      ভর্তি চলছে
                    </span>
                  </div>

                  {/* Highlights List inside Hero Box */}
                  <div className="mt-5 space-y-3.5">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <PlayCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">ইন্টারেক্টিভ লাইভ ও রেকর্ডেড ক্লাস</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">প্রতিটি ক্লাস শেষে লাইব্রেরিতে আনলিমিটেড এক্সেস</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">অধ্যায়ভিত্তিক লেকচার শিট ও নোটস</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Google Drive ইন্টিগ্রেশনের মাধ্যমে নিরাপদ পিডিএফ ডাউনলোড</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">অনলাইন মডেল টেস্ট ও লিডারবোর্ড</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">টাইমার ও নেগেটিভ মার্কিং সহ বোর্ড স্ট্যান্ডার্ড এক্সাম</p>
                      </div>
                    </div>
                  </div>

                  {/* Trust Footer inside card */}
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">যেকোনো তথ্যের জন্য:</span>
                    <a href="tel:01700000000" className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5" /> 16910 / হেল্পলাইন
                    </a>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATS BANNER (10 Minute School Counter Bar) */}
      <section className="bg-slate-900 text-white py-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">১০,০০০+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">নিবন্ধিত শিক্ষার্থী</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">৫০০+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">ভিডিও লেকচার ও নোটস</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">১০০%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">সিলেবাস কভারেজ</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">২৪/৭</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">ডাউট সলভিং সাপোর্ট</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR COURSES SECTION (Direct Clickable Cards) */}
      <section id="courses-section" className="py-16 sm:py-20 bg-slate-50/70 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
                <BookOpen className="w-3.5 h-3.5" /> কোর্সের তালিকা
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                জনপ্রিয় কোর্স ও ব্যাচসমূহ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                শ্রেণিভিত্তিক কোর্স বেছে নিন এবং সরাসরি কোর্সে ক্লিক করে বিস্তারিত ও ব্যাচে ভর্তি হন।
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {classList.slice(0, 6).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedClass === cls
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {cls === 'All' ? 'সকল' : cls}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Grid */}
          {loadingCourses ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500">কোর্সগুলো লোড হচ্ছে...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">কোনো কোর্স পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">এই শ্রেণির জন্য নতুন কোর্স শীঘ্রই যুক্ত করা হচ্ছে।</p>
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
                  className="group block bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Banner */}
                    <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                          {c.gradeLevel}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          {c.subject}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {c.description || 'সম্পূর্ণ অধ্যায়ভিত্তিক বিস্তারিত কনসেপ্ট ও বোর্ড প্রশ্ন বিশ্লেষণ কোর্স।'}
                      </p>
                    </div>

                    {/* Features Snippet */}
                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>লাইভ ক্লাস ও সার্বক্ষণিক ডাউট সলভ</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>লেকচার শিট ও বোর্ড প্রশ্ন সমাধান</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>অধ্যায়ভিত্তিক মডেল টেস্ট এক্সাম</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Pricing & CTA */}
                  <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">কোর্স ফি</span>
                      <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                        ৳ {c.courseFee ? c.courseFee.toLocaleString() : 'ফ্রি'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold group-hover:bg-blue-700 transition-colors shadow-2xs">
                      <span>বিস্তারিত</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* View All Courses Link */}
          <div className="mt-12 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-900 dark:text-white font-bold text-sm shadow-xs hover:shadow-md transition-all"
            >
              <span>সকল কোর্স ও ব্যাচ ক্যাটালগ দেখুন</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </Link>
          </div>

        </div>
      </section>

      {/* 4. WHY GRAV ACADEMY (10 Minute School Style Feature Pillars) */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              আমাদের বিশেষত্ব
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
              কেন গ্র্যাভ একাডেমিতে পড়বেন?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              গতানুগতিক পড়ার বাইরে প্রতিটি বিষয়ের গোড়া থেকে পরিষ্কার ধারণা গড়ে তোলাই আমাদের লক্ষ্য।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">সেরা শিক্ষকবৃন্দ</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                অভিজ্ঞ মেন্টরদের নিবিড় তত্ত্বাবধানে প্রতিটি টপিককে সহজভাবে উপস্থাপন করা হয় যাতে যে কেউ সহজে বুঝতে পারে।
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">প্রিমিয়াম লেকচার শিট</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                প্রতিটি অধ্যায়ের গুরুত্বপূর্ণ সূত্র, ব্যাখ্যামূলক সমাধান এবং বোর্ড প্রশ্ন এনালাইসিস শিট সরাসরি পিডিএফ আকারে প্রদান করা হয়।
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">লাইভ ও রেকর্ডেড ক্লাস</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                লাইভ ক্লাসে প্রশ্ন করার সুযোগ ছাড়াও যেকোনো ক্লাস মিস হলে যতবার ইচ্ছে রেকর্ডেড ভিডিও দেখে রিভিশন দেওয়ার সুবিধা।
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">মডেল টেস্ট ও মূল্যায়ন</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                বোর্ড পরীক্ষার অনুরূপ অনলাইন পরীক্ষা ও অটোমেটিক রেজাল্ট এনালাইসিসের মাধ্যমে নিজের অবস্থান যাচাইয়ের সেরা মাধ্যম।
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. 3-STEP ADMISSION PROCESS */}
      <section className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              কীভাবে শুরু করবেন?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              সহজ তিনটি ধাপে ভর্তি হয়ে আজ থেকেই তোমার একাডেমিক পড়াশোনা শুরু করো।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
                ১
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">অ্যাকাউন্ট তৈরি করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                নাম ও মোবাইল নম্বর দিয়ে বিনামূল্যে রেজিস্ট্রেশন করুন অথবা লগইন করুন।
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-500/20">
                ২
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">কোর্স ও ব্যাচ সিলেক্ট করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                তোমার পছন্দের শ্রেণি ও বিষয়ের কোর্স বিস্তারিত দেখে পছন্দের ব্যাচে এনরোল করুন।
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/20">
                ৩
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">পড়ালেখা শুরু করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                ড্যাশবোর্ড থেকে রুটিন অনুযায়ী লাইভ ক্লাস করুন, নোটস ডাউনলোড করুন ও পরীক্ষা দিন।
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
              জিজ্ঞাসা
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              গ্র্যাভ একাডেমিতে ক্লাস এবং ভর্তি সংক্রান্ত প্রয়োজনীয় প্রশ্নের উত্তর।
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
                    <div className="px-5 pb-5 pt-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100/80 dark:border-slate-800/80 mt-1 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. BOTTOM CALL TO ACTION BANNER */}
      <section className="py-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            আজই শুরু হোক তোমার সেরা প্রস্তুতি!
          </h2>
          <p className="mt-3 text-blue-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            কোনো দ্বিধা না রেখে এখনই অ্যাকাউন্টে লগইন করে তোমার ক্লাসের সিলেবাস ও লাইভ ক্লাস রুটিন দেখে নাও।
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-extrabold text-sm shadow-md transition-all"
            >
              বিনামূল্যে রেজিস্টার করুন
            </Link>
            <Link
              href="/courses"
              className="px-6 py-3 rounded-xl bg-blue-700/80 hover:bg-blue-700 text-white border border-blue-400/40 font-bold text-sm transition-all"
            >
              সকল কোর্স দেখুন
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
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
                ক্লাস ৬ থেকে ১২ শ্রেণির শিক্ষার্থীদের জন্য দেশের অন্যতম আধুনিক অনলাইন একাডেমিক কোচিং প্ল্যাটফর্ম।
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
              <h4 className="font-bold text-white uppercase tracking-wider mb-3">যোগাযোগ ও সহায়তা</h4>
              <p className="leading-relaxed mb-2">সকাল ৯টা থেকে রাত ১০টা পর্যন্ত যেকোনো সহায়তায়:</p>
              <p className="text-white font-bold text-sm">📞 16910 / 01700-000000</p>
              <p className="text-slate-400 mt-1">ইমেইল: support@gravacademy.com</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-2">
            <div>© {new Date().getFullYear()} Grav Academy. All rights reserved.</div>
            <div>Built for Bangladeshi Academic Excellence.</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
