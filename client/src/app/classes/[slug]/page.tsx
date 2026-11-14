'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, BookOpen, ChevronRight, Compass, GraduationCap, Layers } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDriveImageUrl } from '@/lib/drive';
import { getSharedAcademicClasses, AcademicClassItem, getClassSlug } from '@/lib/classes';
import { CourseCardFeatures } from '@/components/course/CourseCardFeatures';

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  const className = academicClass?.name || 'Class';
  const subtitle = academicClass?.subtitle || `${className}-এর শিক্ষার্থীদের জন্য পরিকল্পিত পূর্ণাঙ্গ একাডেমিক প্রোগ্রাম`;
  const description = academicClass?.description || `${className}-এর জন্য সাজানো কোর্স ও শেখার সুযোগ এক জায়গায়।`;

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <section className="relative overflow-hidden cosmic-hero-bg text-white border-b border-white/10 shadow-lg">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[380px] bg-gradient-to-b from-rose-950/45 via-red-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[250px] bg-red-600/15 rounded-full blur-[100px] pointer-events-none -z-10 animate-atmosphere" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[16%] left-[10%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[24%] right-[12%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
          <div className="absolute top-[12%] right-[30%] w-1 h-1 rounded-full bg-sky-200 animate-star-twinkle-medium" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-12 relative z-10">
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-normal leading-[1.35] text-white">
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 pt-1 pb-2">{subtitle}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl font-medium leading-relaxed">{description}</p>
            </div>
            <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-200"><BookOpen className="w-4 h-4 text-amber-300" />{courses.length}টি কোর্স</span>
            </div>
          </div>
        </div>
      </section>

      <section id="courses-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg sm:text-xl font-black text-slate-950 dark:text-white">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 flex items-center justify-center"><Layers className="w-4 h-4" /></span>
              কোর্স বেছে নিন
            </h2>
          </div>
          <Link href="/courses" className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700">
            সব কোর্স <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-14 text-center">
            <Compass className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">এই শ্রেণির কোনো কোর্স এখনো নেই</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">নতুন কোর্স প্রকাশ হলে এখানে দেখা যাবে।</p>
            <Link href="/courses" className="inline-flex items-center gap-1.5 mt-5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition-colors">
              সব কোর্স দেখুন <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <Link key={course._id} href={`/courses/${course.slug || course._id}`} className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-black/20 transition-all">
                <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img src={formatDriveImageUrl(course.thumbnailUrl)} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center"><BookOpen className="w-11 h-11 text-white/80" /></div>
                  )}
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-white/95 dark:bg-slate-950/90 px-2.5 py-1 text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-sm">
                    <GraduationCap className="w-3 h-3 text-blue-600" /> {course.gradeLevel || className}
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="text-base font-black leading-snug text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{course.title}</h3>
                  {course.description && <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">{course.description}</p>}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800"><CourseCardFeatures features={course.features} /></div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      {course.discountPrice && course.discountPrice > 0 && course.regularPrice && course.regularPrice > course.discountPrice ? (
                        <div className="flex items-baseline gap-1.5"><span className="text-base font-black text-slate-950 dark:text-white">৳{course.discountPrice}</span><span className="text-[11px] text-slate-400 line-through">৳{course.regularPrice}</span></div>
                      ) : course.regularPrice || course.courseFee ? (
                        <span className="text-base font-black text-slate-950 dark:text-white">৳{course.regularPrice || course.courseFee}</span>
                      ) : (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">ফ্রি কোর্স</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white group-hover:bg-blue-700 transition-colors">দেখুন <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
