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
    <div className="ga-page ga-public-page pb-16 transition-colors">
      <header className="border-b border-slate-200 bg-white dark:border-[#262b34] dark:bg-[#111318]">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8">
          <div className="max-w-2xl border-l-4 border-orange-500 pl-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">Academic classes</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">শ্রেণি নির্বাচন করুন</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">নিজের শ্রেণি থেকে কোর্স, ব্যাচ রুটিন, সিলেবাস ও লাইভ ক্লাস এক জায়গায় দেখুন।</p>
          </div>
          <Link href="/courses" className="ga-primary-button w-full px-5 py-3 text-xs sm:w-auto">
            <BookOpen className="h-4 w-4" />
            <span>কোর্স দেখুন</span>
          </Link>
        </div>
      </header>

      {/* Grid of Classes */}
      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#262b34]">
          <div><h2 className="text-lg font-black text-slate-900 dark:text-white">সকল শ্রেণি</h2><p className="mt-1 text-xs text-slate-500">একটি শ্রেণি বেছে নিয়ে পড়াশোনা শুরু করুন</p></div>
          {!loading && <span className="text-xs font-bold text-slate-500">{classes.length}টি শ্রেণি</span>}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((cls, idx) => {
              const slug = getClassSlug(cls);
              return (
                <Link
                  key={cls._id || cls.name}
                  href={`/classes/${slug}`}
                  className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-orange-400 dark:border-[#262b34] dark:bg-[#111318] dark:hover:border-orange-600"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-lg font-black text-orange-700 transition-transform group-hover:scale-105 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
                      {idx + 6 <= 12 ? idx + 6 : cls.name.replace(/[^0-9]/g, '') || '🎓'}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-200/60 dark:border-orange-800/60">
                      পূর্ণাঙ্গ সিলেবাস
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors flex items-center gap-2">
                    <span>{cls.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-orange-600 transition-all" />
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {cls.subtitle || cls.description || `${cls.name}-এর শিক্ষার্থীদের জন্য বিজ্ঞান, গণিত ও বোর্ড সহায়িকা কোর্সসমূহ`}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#1e222a] flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400">
                    <span>ক্লাস ও বিষয়সমূহ দেখুন</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
