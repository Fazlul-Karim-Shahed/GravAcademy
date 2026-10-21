'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  X,
  ChevronRight,
  PlayCircle,
  FileText,
  Award,
} from 'lucide-react';

interface Teacher {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  gradeLevel: string;
  subject: string;
  courseFee: number;
  duration?: string;
  instructors?: Teacher[];
  curriculumHighlights?: string[];
}

export default function CoursesCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const gradeLevels = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const subjects = ['Bangla', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'ICT'];

  useEffect(() => {
    fetchCourses();
  }, [selectedGrade, selectedSubject]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params: any = { isPublished: true };
      if (selectedGrade !== 'all') params.gradeLevel = selectedGrade;
      if (selectedSubject !== 'all') params.subject = selectedSubject;

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
    setSelectedSubject('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedGrade !== 'all' || selectedSubject !== 'all' || searchQuery.trim() !== '';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 sm:py-14 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Modern Clean Header */}
        <div className="relative mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/90 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4 shadow-2xs">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>ক্লাস ৬ থেকে ১২ শ্রেণির সিলেবাসভিত্তিক কোর্সসমূহ</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.28]">
            সকল কোর্স ও লাইভ ব্যাচ
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            তোমার প্রয়োজনীয় শ্রেণি ও বিষয় নির্বাচন করে সাজানো সিলেবাস, লাইভ ও রেকর্ডেড ক্লাস, হ্যান্ডনোট এবং নিয়মিত মডেল টেস্টের রুটিন দেখে নাও।
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 mb-10 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="কোর্সের নাম, শ্রেণি বা বিষয় দিয়ে খুঁজুন..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5" /> ফিল্টার:
              </div>

              {/* Grade Dropdown */}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="all">সকল শ্রেণি (৬ষ্ঠ – ১২শ)</option>
                {gradeLevels.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              {/* Subject Dropdown */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="all">সকল বিষয়</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  রিসেট
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">জনপ্রিয় শ্রেণি:</span>
            {['Class 9', 'Class 10', 'Class 11', 'Class 12'].map((g) => {
              const active = selectedGrade === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(active ? 'all' : g)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {g}
                </button>
              );
            })}
            <div className="ml-auto text-xs font-semibold text-slate-500 dark:text-slate-400">
              মোট <strong className="text-slate-900 dark:text-white font-extrabold">{filteredCourses.length}</strong> টি কোর্স রয়েছে
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse overflow-hidden"
              >
                <div className="h-44 bg-slate-200 dark:bg-slate-800" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center py-20 px-4 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">কোনো কোর্স খুঁজে পাওয়া যায়নি</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5 mb-6">
              আপনার ফিল্টার অনুযায়ী কোনো কোর্স পাওয়া যায়নি। ফিল্টার রিসেট করে পুনরায় চেষ্টা করুন।
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              সকল কোর্স দেখুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course, idx) => {
              const currentTheme = cardThemes[idx % cardThemes.length];
              const regularPrice = course.courseFee ? Math.round(course.courseFee * 1.35) : null;
              const instructorName =
                course.instructors && course.instructors.length > 0
                  ? typeof course.instructors[0] === 'object'
                    ? course.instructors[0].name
                    : 'ফ্যাকাল্টি মেন্টর'
                  : 'গ্র্যাভ একাডেমি শিক্ষক প্যানেল';

              return (
                <Link
                  key={course._id}
                  href={`/courses/${course.slug || course._id}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-2xl hover:border-blue-500/80 dark:hover:border-blue-500/80 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Top Thumbnail Banner with Vibrant EdTech Gradient */}
                    <div className={`relative h-44 bg-gradient-to-br ${currentTheme.gradient} p-5 flex flex-col justify-between overflow-hidden`}>
                      {/* Decorative background geometry */}
                      <div className={`absolute -right-8 -bottom-8 w-36 h-36 rounded-full ${currentTheme.blob1} blur-xl pointer-events-none`} />
                      <div className={`absolute right-4 top-4 w-20 h-20 rounded-full ${currentTheme.blob2} blur-lg pointer-events-none`} />

                      {/* Badges on Thumbnail */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-extrabold border border-white/25 shadow-xs">
                          {course.gradeLevel}
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 text-slate-900 dark:text-white text-[11px] font-black shadow-sm border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
                            <span className="relative m-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                          </span>
                          লাইভ ব্যাচ
                        </span>
                      </div>

                      {/* Subject & Title Overlay */}
                      <div className="relative z-10">
                        <span className={`text-xs font-bold ${currentTheme.tag} uppercase tracking-wider block mb-1 drop-shadow-xs`}>
                          {course.subject} স্পেশাল
                        </span>
                        <h4 className="text-white text-base sm:text-lg font-black leading-snug line-clamp-1 drop-shadow-sm group-hover:underline transition-colors">
                          {course.title}
                        </h4>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-6">
                      {/* Instructor Credit Line */}
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                          <GraduationCap className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          মেন্টর: {instructorName}
                        </span>
                      </div>

                      {/* Short Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-[1.7] mb-4">
                        {course.description || 'সম্পূর্ণ অধ্যায়ভিত্তিক বিস্তারিত কনসেপ্ট ও বোর্ড পরীক্ষার জন্য চূড়ান্ত প্রস্তুতিমূলক কোর্স।'}
                      </p>

                      {/* Features Micro-List */}
                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>লাইভ ক্লাস ও সার্বক্ষণিক ডাউট সলভ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>অধ্যায়ভিত্তিক লেকচার শিট ও ফর্মুলা বুক</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>অনলাইন মডেল টেস্ট ও মূল্যায়ন</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Strikethrough Pricing & High-Conversion CTA */}
                  <div className="p-6 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                    <div className="flex items-baseline justify-between mb-3.5">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">কোর্স ফি</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                            {course.courseFee ? `৳ ${course.courseFee.toLocaleString()}` : 'ফ্রি'}
                          </span>
                          {regularPrice && (
                            <span className="text-xs text-slate-400 line-through font-semibold">
                              ৳ {regularPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {regularPrice && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[11px] font-extrabold border border-rose-200/80 dark:border-rose-900/60">
                          ২৬% ছাড়
                        </span>
                      )}
                    </div>

                    <div className="w-full py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs sm:text-sm text-center shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                      <span>কোর্সটি দেখুন</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
