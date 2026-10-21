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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Hero Header */}
        <div className="relative mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/90 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4 shadow-2xs">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>ক্লাস ৬ থেকে ১২ শ্রেণির সিলেবাসভিত্তিক কোর্স</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.28]">
            সকল একাডেমিক কোর্স ও ব্যাচ
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            তোমার পছন্দের শ্রেণি ও বিষয় নির্বাচন করে সাজানো সিলেবাস, লাইভ ও রেকর্ডেড ক্লাস, হ্যান্ডনোট এবং অনলাইন মডেল টেস্টের রুটিন দেখে নাও।
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="কোর্সের নাম, শ্রেণি বা বিষয় দিয়ে খুঁজুন..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9.5 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
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
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
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
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
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
                  className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
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
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse p-6"
              >
                <div className="flex justify-between mb-4">
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md mb-3" />
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-md mb-2" />
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-md mb-6" />
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-auto">
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center py-16 px-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">কোনো কোর্স খুঁজে পাওয়া যায়নি</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
              আপনার ফিল্টার অনুযায়ী কোনো কোর্স পাওয়া যায়নি। ফিল্টার রিসেট করে পুনরায় চেষ্টা করুন।
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link
                key={course._id}
                href={`/courses/${course.slug || course._id}`}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Badges Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-extrabold shadow-2xs">
                      {course.gradeLevel}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      {course.subject}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                    {course.description || 'সম্পূর্ণ অধ্যায়ভিত্তিক বিস্তারিত কনসেপ্ট ও বোর্ড পরীক্ষার জন্য চূড়ান্ত প্রস্তুতিমূলক কোর্স।'}
                  </p>
                </div>

                {/* Footer Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">কোর্স ফি</span>
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                      {course.courseFee === 0 ? 'ফ্রি' : `৳ ${course.courseFee.toLocaleString()}`}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors">
                    <span>বিস্তারিত ও ভর্তি</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
