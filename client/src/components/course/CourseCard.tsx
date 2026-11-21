'use client';

import Link from 'next/link';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { formatDriveImageUrl } from '@/lib/drive';

export type CourseCardData = {
  _id: string;
  slug?: string;
  title: string;
  gradeLevel?: string;
  description?: string;
  thumbnailUrl?: string;
  regularPrice?: number;
  discountPrice?: number;
  courseFee?: number;
};

type CourseCardProps = {
  course: CourseCardData;
  className?: string;
  variant?: 'default' | 'catalog';
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

export function CourseCard({ course, className = '', variant = 'default' }: CourseCardProps) {
  const isCatalog = variant === 'catalog';
  const price = course.discountPrice && course.discountPrice > 0
    ? course.discountPrice
    : course.regularPrice || course.courseFee;
  const hasDiscount = Boolean(
    course.discountPrice && course.regularPrice && course.regularPrice > course.discountPrice,
  );

  return (
    <Link
      href={`/courses/${course.slug || course._id}`}
      className={`group flex flex-col overflow-hidden border border-slate-200/90 bg-white p-0 transition-all hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500/50 ${isCatalog ? 'rounded-2xl shadow-[0_3px_14px_rgba(15,23,42,0.045)] hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.09)]' : 'rounded-[18px] shadow-xs hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/5 sm:rounded-[22px]'} ${className}`}
    >
      <div className={`relative w-full overflow-hidden border-b border-slate-100 bg-[#180a22] dark:border-slate-800/80 ${isCatalog ? 'aspect-[16/10]' : 'aspect-[16/9] rounded-t-[17px] sm:rounded-t-[21px]'}`}>
        {course.thumbnailUrl ? (
          <img
            src={formatDriveImageUrl(course.thumbnailUrl)}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`relative h-full w-full overflow-hidden ${isCatalog ? 'bg-[#111827]' : 'bg-[#0b1732]'}`}>
            <div className={`absolute -left-10 -top-14 h-44 w-72 rounded-full blur-3xl ${isCatalog ? 'bg-orange-600/25' : 'bg-indigo-500/70'}`} />
            <div className={`absolute left-[28%] -top-10 h-36 w-56 rounded-full blur-3xl ${isCatalog ? 'bg-amber-500/15' : 'bg-violet-400/50'}`} />
            <div className={`absolute -right-12 top-0 h-36 w-64 rounded-full blur-3xl ${isCatalog ? 'bg-slate-500/20' : 'bg-sky-400/45'}`} />
            <div className="absolute bottom-[-45%] left-[-10%] h-40 w-[120%] rounded-[50%] bg-[#071126] blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-400/15 via-violet-400/10 to-[#071226]/90" />
            <div className="relative flex h-full flex-col items-center justify-center px-3 text-center">
              <span className="rounded-sm bg-[#12366d] px-2 py-0.5 sm:py-1 text-[clamp(9px,1.8vw,14px)] font-black leading-[1.05] tracking-wide text-amber-300 shadow-md">
                {getProgramLabel(course.gradeLevel).split(' ').map((word) => <span key={word} className="block">{word}</span>)}
              </span>
              <span className="mt-1 rounded-sm bg-[#e11d68] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[clamp(11px,2.2vw,18px)] font-black leading-none text-white shadow-md">
                {getClassLabel(course.gradeLevel)}
              </span>
              <span className="mt-1 text-[clamp(8px,1.4vw,12px)] font-bold text-white">ব্যাচ: ২০২৫</span>
            </div>
          </div>
        )}
        {course.gradeLevel && course.thumbnailUrl && (
          <span className="absolute left-2 top-2 sm:left-3 sm:top-3 inline-flex items-center gap-1 rounded-md bg-slate-950/75 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-sm">
            <GraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-300" />
            {course.gradeLevel}
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${isCatalog ? 'p-4 sm:p-5' : 'p-2.5 sm:p-3.5'}`}>
        <h3 className={`ga-course-card-title line-clamp-2 font-bold leading-snug text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 ${isCatalog ? 'text-base sm:text-lg' : 'text-xs sm:text-sm md:text-base sm:font-black'}`}>
          {course.title}
        </h3>
        {course.description && (
          <p className={`mt-1.5 leading-relaxed text-slate-500 dark:text-slate-400 ${isCatalog ? 'line-clamp-2 text-xs sm:text-sm' : 'line-clamp-1 text-[10px] sm:text-xs'}`}>{course.description}</p>
        )}
        <div className="mt-auto pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500">ভর্তি চলছে</span>
            {price ? (
              <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs sm:text-base font-black text-orange-600 dark:text-orange-400">৳{price}</span>
                {hasDiscount && <span className="text-[9px] sm:text-[11px] text-slate-400 line-through">৳{course.regularPrice}</span>}
              </div>
            ) : (
              <span className="mt-0.5 block text-[11px] sm:text-sm font-black text-emerald-600 dark:text-emerald-400">ফ্রি কোর্স</span>
            )}
          </div>
          <span className={`ga-course-card-action inline-flex w-full shrink-0 items-center justify-center gap-1 bg-orange-600 font-bold text-white shadow-xs transition-all duration-200 hover:bg-orange-700 sm:w-auto ${isCatalog ? 'rounded-lg px-3.5 py-2 text-xs' : 'rounded-lg px-2.5 py-1.5 text-[10.5px] sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-xs'}`}>
            {isCatalog ? 'কোর্স দেখুন' : 'ব্যাচ দেখুন'} <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
