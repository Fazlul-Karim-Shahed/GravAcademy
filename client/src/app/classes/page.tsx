'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Layers,
  Award,
  Users,
} from 'lucide-react';
import { getSharedAcademicClasses, AcademicClassItem, getClassSlug } from '@/lib/classes';

export default function AcademicClassesHubPage() {
  const [classes, setClasses] = useState<AcademicClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await getSharedAcademicClasses();
        setClasses(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c1a] text-slate-900 dark:text-slate-100 transition-colors pb-16">
      {/* Cosmic Header Strip */}
      <div className="relative overflow-hidden cosmic-hero-bg text-white pt-10 pb-12 sm:pt-14 sm:pb-16 mb-8 sm:mb-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[360px] bg-gradient-to-b from-rose-950/45 via-red-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[250px] bg-red-600/15 rounded-full blur-[100px] pointer-events-none -z-10 animate-atmosphere" />
        
        {/* Twinkling Cosmic Stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[14%] left-[10%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[24%] left-[20%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
          <div className="absolute top-[12%] right-[16%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
          <span className="shooting-star meteor-1" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ক্লাস ৬ হতে ১২ একাডেমিক প্রোগ্রাম</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-normal leading-[1.3] text-white">
                শ্রেণিভিত্তিক{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300">
                  একাডেমিক ক্লাস হাব
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl font-medium leading-relaxed">
                তোমার শ্রেণি নির্বাচন করে সংশ্লিষ্ট সকল কোর্স, ব্যাচ রুটিন, সিলেবাস এবং লাইভ ক্লাসে অংশ নাও।
              </p>
            </div>

            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-98 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/30 transition-all border border-white/20"
            >
              <BookOpen className="w-4 h-4" />
              <span>সকল কোর্স ক্যাটালগ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Classes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {classes.map((cls, idx) => {
              const slug = getClassSlug(cls);
              return (
                <Link
                  key={cls._id || cls.name}
                  href={`/classes/${slug}`}
                  className="group block p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/50 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                      {idx + 6 <= 12 ? idx + 6 : cls.name.replace(/[^0-9]/g, '') || '🎓'}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/60 dark:border-blue-800/60">
                      পূর্ণাঙ্গ সিলেবাস
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    <span>{cls.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {cls.subtitle || cls.description || `${cls.name}-এর শিক্ষার্থীদের জন্য বিজ্ঞান, গণিত ও বোর্ড সহায়িকা কোর্সসমূহ`}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span>ক্লাস ও বিষয়সমূহ দেখুন</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
