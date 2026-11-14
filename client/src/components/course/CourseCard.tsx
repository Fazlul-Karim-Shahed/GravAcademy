'use client';

import Link from 'next/link';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { formatDriveImageUrl } from '@/lib/drive';
import { CourseCardFeatures } from '@/components/course/CourseCardFeatures';

export type CourseCardData = {
  _id: string;
  slug?: string;
  title: string;
  gradeLevel?: string;
  description?: string;
  thumbnailUrl?: string;
  features?: any[];
  regularPrice?: number;
  discountPrice?: number;
  courseFee?: number;
};

type CourseCardProps = {
  course: CourseCardData;
  className?: string;
};

function getProgramLabel(gradeLevel?: string) {
  const value = String(gradeLevel || '').toLowerCase();
  if (/^(9|10)$/.test(value)) return 'SECONDARY PROGRAM';
  if (/^(11|12)$/.test(value)) return 'COLLEGE PROGRAM';
  if (/college|hsc|xi|xii|class\s*1[12]|class\s*11|class\s*12/.test(value)) return 'COLLEGE PROGRAM';
  if (/ssc|class\s*9|class\s*10|grade\s*9|grade\s*10/.test(value)) return 'SECONDARY PROGRAM';
  return 'SCHOOL PROGRAM';
}

function getClassLabel(gradeLevel?: string) {
  const value = String(gradeLevel || '').trim();
  const match = value.match(/(?:class|grade|শ্রেণি)\s*[-:]?\s*(\d{1,2})/i);
  return match ? `CLASS ${match[1]}` : /^\d{1,2}$/.test(value) ? `CLASS ${value}` : value ? value.toUpperCase() : 'CLASS';
}

export function CourseCard({ course, className = '' }: CourseCardProps) {
  const price = course.discountPrice && course.discountPrice > 0
    ? course.discountPrice
    : course.regularPrice || course.courseFee;
  const hasDiscount = Boolean(
    course.discountPrice && course.regularPrice && course.regularPrice > course.discountPrice,
  );

  return (
    <Link
      href={`/courses/${course.slug || course._id}`}
      className={`group flex flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 ${className}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-[17px] bg-[#180a22]">
        {course.thumbnailUrl ? (
          <img
            src={formatDriveImageUrl(course.thumbnailUrl)}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden bg-[#17091f]">
            <div className="absolute -left-8 -top-12 h-44 w-72 rounded-full bg-fuchsia-600/75 blur-3xl" />
            <div className="absolute -right-10 top-0 h-36 w-64 rounded-full bg-purple-500/80 blur-3xl" />
            <div className="absolute bottom-[-45%] left-[-10%] h-40 w-[120%] rounded-[50%] bg-[#26071d] blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/20 via-purple-500/10 to-[#16071b]/80" />
            <div className="relative flex h-full flex-col items-center justify-center px-3 text-center">
              <span className="rounded-sm bg-[#12366d] px-2 py-1 text-[clamp(10px,2vw,15px)] font-black leading-[1.05] tracking-wide text-amber-300 shadow-md">
                {getProgramLabel(course.gradeLevel).split(' ').map((word) => <span key={word} className="block">{word}</span>)}
              </span>
              <span className="mt-1 rounded-sm bg-[#e11d68] px-2.5 py-1 text-[clamp(12px,2.4vw,20px)] font-black leading-none text-white shadow-md">
                {getClassLabel(course.gradeLevel)}
              </span>
              <span className="mt-1.5 text-[clamp(9px,1.6vw,13px)] font-bold text-white">ব্যাচ: ২০২৫</span>
            </div>
          </div>
        )}
        {course.gradeLevel && course.thumbnailUrl && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-slate-950/75 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            <GraduationCap className="h-3 w-3 text-amber-300" />
            {course.gradeLevel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-2.5 pt-3.5 sm:px-4 sm:pb-3">
        <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-1.5 line-clamp-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{course.description}</p>
        )}
        {course.features && course.features.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <CourseCardFeatures features={course.features} />
          </div>
        )}

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500">ভর্তি চলছে</span>
            {price ? (
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-base font-black text-pink-600 dark:text-pink-400">৳{price}</span>
                {hasDiscount && <span className="text-[11px] text-slate-400 line-through">৳{course.regularPrice}</span>}
              </div>
            ) : (
              <span className="mt-0.5 block text-sm font-black text-emerald-600 dark:text-emerald-400">ফ্রি কোর্স</span>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors group-hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:group-hover:bg-blue-500 dark:group-hover:text-white">
            ব্যাচ দেখুন <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
