'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, BookOpen, Compass } from 'lucide-react';
import { api } from '@/lib/api';
import { getSharedAcademicClasses, AcademicClassItem, getClassSlug } from '@/lib/classes';
import { CourseCard } from '@/components/course/CourseCard';

export default function DedicatedClassPage() {
  const params = useParams();
  const slugParam = (params?.slug as string) || '';
  const [academicClass, setAcademicClass] = useState<AcademicClassItem | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassData();
  }, [slugParam]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const classList = await getSharedAcademicClasses();
      const matchedLocal = classList.find(
        (item) =>
          getClassSlug(item).toLowerCase() === slugParam.toLowerCase() ||
          item.name.toLowerCase() === slugParam.replace(/-/g, ' ').toLowerCase() ||
          item._id === slugParam,
      );

      let backendData: any = null;
      try {
        const response = await api.get(`/classes/${slugParam}`);
        if (response.data?.success && response.data.data) backendData = response.data.data;
      } catch {
        // Fall back to the shared class list when the class endpoint is unavailable.
      }

      if (backendData?.academicClass) {
        setAcademicClass(backendData.academicClass);
        setCourses(backendData.courses || []);
      } else if (matchedLocal) {
        setAcademicClass(matchedLocal);
        try {
          const coursesResponse = await api.get('/courses', {
            params: { gradeLevel: matchedLocal.name, isPublished: true },
          });
          if (coursesResponse.data?.success) setCourses(coursesResponse.data.data || []);
        } catch (error) {
          console.warn('Courses fetch error:', error);
        }
      } else {
        setAcademicClass({
          _id: 'default',
          name: slugParam.replace(/-/g, ' ').toUpperCase(),
          order: 1,
          description: 'এই শ্রেণির জন্য একাডেমিক কোর্স ও ব্যাচগুলো দেখুন।',
        });
        setCourses([]);
      }
    } catch (error) {
      console.error('Failed to load class page data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ga-page min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-orange-600 animate-spin" />
      </div>
    );
  }

  const className = academicClass?.name || 'Class';
  const isClassTen = slugParam.toLowerCase() === 'class-10' || getClassSlug(academicClass || ({} as AcademicClassItem)).toLowerCase() === 'class-10';
  const pageTitle = isClassTen ? 'ক্লাস ১০ একাডেমিক প্রোগ্রাম' : (academicClass?.subtitle || `${className}-এর শিক্ষার্থীদের জন্য পরিকল্পিত পূর্ণাঙ্গ একাডেমিক প্রোগ্রাম`);
  const pageSubtitle = isClassTen ? 'বোর্ড পরীক্ষার পূর্ণাঙ্গ প্রস্তুতি ও সাফল্যের লক্ষ্য।' : null;
  return (
    <main className="ga-page ga-public-page text-slate-900 dark:text-slate-100 pb-20">
      <section className="border-b border-slate-200 bg-white dark:border-[#262b34] dark:bg-[#111318]">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-3xl border-l-4 border-orange-500 pl-5">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                <span>{pageTitle}</span>
                {pageSubtitle && <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300 sm:text-base">{pageSubtitle}</p>}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-300">
              <BookOpen className="w-4 h-4 text-orange-500" />
              {courses.length}টি কোর্স
            </div>
          </div>
        </div>
      </section>

      <section id="courses-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12">
        {courses.length === 0 ? (
          <div className="ga-card px-6 py-14 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400"><Compass className="h-5 w-5" /></span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">এই শ্রেণির কোনো কোর্স এখনো নেই</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">নতুন কোর্স প্রকাশ হলে এখানে দেখা যাবে।</p>
            <Link href="/courses" className="ga-primary-button mt-5 text-xs">
              সব কোর্স দেখুন <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {courses.map((course) => <CourseCard key={course._id} course={{ ...course, gradeLevel: course.gradeLevel || className }} />)}
          </div>
        )}
      </section>
    </main>
  );
}
