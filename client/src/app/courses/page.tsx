'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { CourseCard } from '@/components/course/CourseCard';
import { api } from '@/lib/api';
import { AcademicClassItem, getSharedAcademicClasses } from '@/lib/classes';

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
}

type FilterPanelProps = {
  gradeLevels: Array<{ label: string; value: string }>;
  subjects: string[];
  selectedGrade: string;
  selectedSubject: string;
  onGradeChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
};

function FilterPanel({
  gradeLevels,
  subjects,
  selectedGrade,
  selectedSubject,
  onGradeChange,
  onSubjectChange,
}: FilterPanelProps) {
  return (
    <div className="space-y-7">
      <section>
        <h2 className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">শ্রেণি</h2>
        <div className="space-y-1">
          {gradeLevels.map((grade) => {
            const active = selectedGrade === grade.value;
            return (
              <button
                key={grade.value}
                type="button"
                onClick={() => onGradeChange(grade.value)}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                <span>{grade.label}</span>
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </section>

      {subjects.length > 0 && (
        <section className="border-t border-slate-200 pt-6 dark:border-white/10">
          <h2 className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">বিষয়</h2>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSubjectChange('all')}
              className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-semibold transition-colors ${
                selectedSubject === 'all'
                  ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              <span>সকল বিষয়</span>
              {selectedSubject === 'all' && <Check className="h-4 w-4" />}
            </button>
            {subjects.map((subject) => {
              const active = selectedSubject === subject;
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => onSubjectChange(subject)}
                  className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <span>{subject}</span>
                  {active && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default function CoursesCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [dynamicClasses, setDynamicClasses] = useState<AcademicClassItem[]>([]);

  const gradeLevels = useMemo(
    () => [
      { label: 'সকল কোর্স', value: 'all' },
      ...dynamicClasses.map((item) => ({ label: item.name, value: item.name })),
    ],
    [dynamicClasses],
  );

  const subjects = useMemo(
    () => Array.from(new Set(courses.map((course) => course.subject?.trim()).filter(Boolean))).sort(),
    [courses],
  );

  useEffect(() => {
    getSharedAcademicClasses().then(setDynamicClasses);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | boolean> = { isPublished: true };
        if (selectedGrade !== 'all') params.gradeLevel = selectedGrade;
        const response = await api.get('/courses', { params });
        if (response.data?.success) setCourses(response.data.data);
      } catch (error) {
        console.error('Failed to load courses', error);
      } finally {
        setLoading(false);
      }
    };

    setSelectedSubject('all');
    fetchCourses();
  }, [selectedGrade]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFiltersOpen]);

  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [course.title, course.subject, course.gradeLevel, course.description]
      .some((value) => value?.toLowerCase().includes(query));
    const matchesSubject = selectedSubject === 'all' || course.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const hasActiveFilters = selectedGrade !== 'all' || selectedSubject !== 'all' || Boolean(searchQuery.trim());
  const activeFilterCount = Number(selectedGrade !== 'all') + Number(selectedSubject !== 'all');

  const clearFilters = () => {
    setSelectedGrade('all');
    setSelectedSubject('all');
    setSearchQuery('');
  };

  return (
    <main className="ga-page ga-modern-page min-h-screen bg-slate-50 text-slate-950 dark:bg-[#090b10] dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#0d1016]">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                সকল কোর্স ও <span className="text-orange-600 dark:text-orange-400">চলতি ব্যাচসমূহ</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                শ্রেণিভিত্তিক সেরা শিক্ষক ও লাইভ মেন্টরশিপের মাধ্যমে ঘরে বসেই শুরু করো পূর্ণাঙ্গ একাডেমিক ও বোর্ড প্রস্তুতি।
              </p>
            </div>

            <label className="group relative block">
              <span className="sr-only">কোর্স খুঁজুন</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-600" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="কোর্সের নাম বা বিষয় দিয়ে খুঁজুন"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="সার্চ মুছুন"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
          <button type="button" onClick={() => setMobileFiltersOpen(true)} className="ga-secondary-button min-h-11 gap-2 px-4 text-sm">
            <Filter className="h-4 w-4" />
            ফিল্টার
            {activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-black text-white">{activeFilterCount}</span>}
          </button>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{loading ? 'লোড হচ্ছে' : `${filteredCourses.length}টি কোর্স`}</p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="ga-card sticky top-24 hidden p-4 lg:block" aria-label="কোর্স ফিল্টার">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <h2 className="text-sm font-black">ফিল্টার</h2>
              </div>
              {hasActiveFilters && <button type="button" onClick={clearFilters} className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400">রিসেট</button>}
            </div>
            <FilterPanel gradeLevels={gradeLevels} subjects={subjects} selectedGrade={selectedGrade} selectedSubject={selectedSubject} onGradeChange={setSelectedGrade} onSubjectChange={setSelectedSubject} />
          </aside>

          <section aria-live="polite">
            <div className="mb-5 hidden min-h-11 items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10 lg:flex">
              <div>
                <h2 className="text-base font-black">কোর্সসমূহ</h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{loading ? 'কোর্স লোড হচ্ছে' : `${filteredCourses.length}টি কোর্স পাওয়া গেছে`}</p>
              </div>
              {hasActiveFilters && <button type="button" onClick={clearFilters} className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400">সব ফিল্টার মুছুন</button>}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="ga-card h-[390px] animate-pulse overflow-hidden p-3">
                    <div className="aspect-[16/10] rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-3 p-3">
                      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="ga-card mx-auto my-8 max-w-lg px-6 py-16 text-center">
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400"><BookOpen className="h-5 w-5" /></span>
                <h3 className="text-base font-black">কোনো কোর্স পাওয়া যায়নি</h3>
                <p className="mx-auto mb-5 mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">আপনার ফিল্টারের সাথে মিলে এমন কোনো কোর্স পাওয়া যায়নি। ফিল্টার রিসেট করে সব কোর্স দেখতে পারেন।</p>
                <button type="button" onClick={clearFilters} className="ga-primary-button text-xs">সকল কোর্স দেখুন</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => <CourseCard key={course._id} course={course} variant="catalog" className="ga-course-card ga-catalog-course-card" />)}
              </div>
            )}
          </section>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="কোর্স ফিল্টার">
          <button type="button" aria-label="ফিল্টার বন্ধ করুন" onClick={() => setMobileFiltersOpen(false)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#111318]">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <h2 className="text-base font-black">কোর্স ফিল্টার</h2>
              </div>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300" aria-label="বন্ধ করুন"><X className="h-4 w-4" /></button>
            </div>
            <FilterPanel gradeLevels={gradeLevels} subjects={subjects} selectedGrade={selectedGrade} selectedSubject={selectedSubject} onGradeChange={setSelectedGrade} onSubjectChange={setSelectedSubject} />
            <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 bg-white pt-4 dark:border-white/10 dark:bg-[#111318]">
              <button type="button" onClick={clearFilters} className="ga-secondary-button min-h-11 text-sm">রিসেট</button>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="ga-primary-button min-h-11 text-sm">{filteredCourses.length}টি কোর্স দেখুন</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
