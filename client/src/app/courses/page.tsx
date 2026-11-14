'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDriveImageUrl } from '@/lib/drive';
import {
  BookOpen,
  GraduationCap,
  Search,
  Filter,
  X,
  ChevronRight,
  PlayCircle,
  FileText,
  Award,
} from 'lucide-react';
import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';
import { CourseCardFeatures } from '@/components/course/CourseCardFeatures';
import { CourseCard } from '@/components/course/CourseCard';

interface Teacher {
  _id: string;
  name: string;
}

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
  instructors?: Teacher[];
  curriculumHighlights?: string[];
  features?: string[];
}

export default function CoursesCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const [dynamicClasses, setDynamicClasses] = useState<AcademicClassItem[]>([]);

  // Compute tabs strictly from Admin Classes
  const gradeLevels = React.useMemo(() => {
    return [
      { label: 'সকল কোর্স', value: 'all' },
      ...dynamicClasses.map((c) => ({ label: c.name, value: c.name })),
    ];
  }, [dynamicClasses]);

  useEffect(() => {
    fetchDynamicClasses();
  }, []);

  const fetchDynamicClasses = async () => {
    const list = await getSharedAcademicClasses();
    setDynamicClasses(list);
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedGrade]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params: any = { isPublished: true };
      if (selectedGrade !== 'all') params.gradeLevel = selectedGrade;

      const res = await api.get('/courses', { params });
      if (res.data?.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.gradeLevel.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const clearFilters = () => {
    setSelectedGrade('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedGrade !== 'all' || searchQuery.trim() !== '';

  const cardThemes = [
    {
      gradient: 'from-violet-600 via-indigo-600 to-purple-800',
      tag: 'text-violet-200',
      blob1: 'bg-white/15',
      blob2: 'bg-indigo-300/25',
    },
    {
      gradient: 'from-emerald-600 via-teal-600 to-cyan-800',
      tag: 'text-teal-200',
      blob1: 'bg-white/15',
      blob2: 'bg-emerald-300/25',
    },
    {
      gradient: 'from-blue-600 via-indigo-600 to-sky-900',
      tag: 'text-sky-200',
      blob1: 'bg-white/15',
      blob2: 'bg-sky-300/25',
    },
    {
      gradient: 'from-rose-600 via-pink-600 to-purple-900',
      tag: 'text-rose-200',
      blob1: 'bg-white/15',
      blob2: 'bg-pink-300/25',
    },
    {
      gradient: 'from-amber-600 via-orange-600 to-rose-900',
      tag: 'text-amber-200',
      blob1: 'bg-white/15',
      blob2: 'bg-amber-300/25',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c1a] text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. COSMIC GLOWING HERO HEADER STRIP (Matching Home Page Cosmic Theme) */}
      <div className="relative overflow-hidden cosmic-hero-bg text-white pt-10 pb-12 sm:pt-14 sm:pb-16">
        
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-normal leading-[1.35] text-white">
                সকল কোর্স ও{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 pt-1 pb-2 px-1">
                  চলতি ব্যাচসমূহ
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl font-medium leading-relaxed">
                শ্রেণিভিত্তিক সেরা শিক্ষক ও লাইভ মেন্টরশিপের মাধ্যমে ঘরে বসেই শুরু করো পূর্ণাঙ্গ একাডেমিক ও বোর্ড প্রস্তুতি।
              </p>
            </div>

            {/* Smart Cosmic Glass Search Bar */}
            <div className="w-full md:w-88 relative">
              <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="কোর্সের নাম বা বিষয় দিয়ে খুঁজুন..."
                className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 backdrop-blur-xl border border-white/20 focus:border-indigo-400 rounded-2xl pl-10 pr-9 py-3 text-xs sm:text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all font-medium shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cute Frosted Pill Tabs for Grade Selection */}
          <div className="pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-3.5 px-1 -mx-1">
            {gradeLevels.map((g) => {
              const active = selectedGrade === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setSelectedGrade(g.value)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-300 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/40 border border-white/30'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 backdrop-blur-md'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}

            {hasActiveFilters && (
              <div className="ml-auto pl-2 shrink-0">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-xs font-black text-rose-300 hover:text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 rounded-xl transition-all whitespace-nowrap cursor-pointer"
                  title="ফিল্টার রিসেট করুন"
                >
                  রিসেট
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        {/* Course Count / Active Filter Status */}
        <div className="flex items-center justify-between mb-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>
              উপলব্ধ কোর্স: <span className="text-slate-900 dark:text-white font-extrabold">{filteredCourses.length}</span> টি
            </span>
          </div>
          {searchQuery && (
            <div className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 text-xs">
              সার্চ ফিল্টার: <span className="text-blue-600 dark:text-blue-400 font-bold">"{searchQuery}"</span>
            </div>
          )}
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 rounded-[34px] bg-white/70 dark:bg-slate-900/70 border-2 border-slate-200/80 dark:border-slate-800/80 animate-pulse overflow-hidden p-3"
              >
                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[26px]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center py-16 px-4 shadow-xs max-w-md mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3.5">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">কোনো কোর্স পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
              আপনার ফিল্টারের সাথে মিলে এমন কোনো কোর্স পাওয়া যায়নি। ফিল্টার রিসেট করে সব কোর্স দেখতে পারেন।
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              সকল কোর্স দেখুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCourses.map((c: any, idx) => {
              return <CourseCard key={c._id} course={c} />;

            })}
          </div>
        )}

      </div>
    </div>
  );
}
