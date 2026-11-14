'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDriveImageUrl } from '@/lib/drive';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import {
  ArrowRight,
  Atom,
  BookOpen,
  BookMarked,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Edit,
  FlaskConical,
  Globe2,
  GraduationCap,
  Languages,
  Landmark,
  Layers3,
  Loader2,
  Mail,
  Monitor,
  PenTool,
  Phone,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

interface Batch {
  _id: string;
  name: string;
  status: string;
  scheduleText?: string;
  weeklySchedule?: any[];
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface SyllabusItem {
  title: string;
  details: string;
}

interface CourseDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  gradeLevel: string;
  subject?: string;
  courseFee: number;
  regularPrice?: number;
  discountPrice?: number;
  duration?: string;
  targetAudience?: string;
  instructors?: Teacher[];
  curriculumHighlights?: string[];
  features?: string[];
  syllabus?: SyllabusItem[];
}

const fallbackSyllabus: SyllabusItem[] = [
  { title: 'বাংলা ১ম পত্র', details: 'গল্প, কবিতা, সৃজনশীল প্রশ্ন ও বোর্ডভিত্তিক অনুশীলন।' },
  { title: 'বাংলা ২য় পত্র', details: 'ব্যাকরণ, নির্মিতি ও লিখিত অংশের নিয়মিত practice।' },
  { title: 'ইংরেজি ১ম পত্র', details: 'Reading, comprehension, writing এবং পরীক্ষার প্রশ্ন অনুশীলন।' },
  { title: 'ইংরেজি ২য় পত্র', details: 'Grammar, paragraph, composition ও model test practice।' },
  { title: 'গণিত', details: 'অধ্যায়ভিত্তিক concept, shortcut এবং ধাপে ধাপে problem solving।' },
  { title: 'বিজ্ঞান', details: 'মূল ধারণা, diagram, প্রয়োগ ও পরীক্ষাভিত্তিক প্রস্তুতি।' },
  { title: 'বাংলাদেশ ও বিশ্বপরিচয়', details: 'গুরুত্বপূর্ণ অধ্যায়, short note ও CQ/MCQ প্রস্তুতি।' },
  { title: 'তথ্য ও যোগাযোগ প্রযুক্তি', details: 'ধারণা পরিষ্কার, practical topic এবং নির্বাচিত প্রশ্ন সমাধান।' },
  { title: 'মডেল টেস্ট', details: 'সময় ধরে পরীক্ষা, ফলাফল বিশ্লেষণ ও revision plan।' },
  { title: 'রিভিশন ও ডাউট সলভিং', details: 'দুর্বল অধ্যায় চিহ্নিত করে focused revision support।' },
];

function cleanBenefit(value: string) {
  return value.replace(/^icon:[^|]+\|/, '').trim();
}

function courseProgram(gradeLevel?: string) {
  const value = String(gradeLevel || '').toLowerCase();
  if (/college|hsc|11|12|xi|xii/.test(value)) return 'COLLEGE PROGRAM';
  if (/9|10|ssc/.test(value)) return 'SECONDARY PROGRAM';
  return 'SCHOOL PROGRAM';
}

function classLabel(gradeLevel?: string) {
  const value = String(gradeLevel || '').trim();
  const match = value.match(/(?:class|grade|শ্রেণি)\s*[-:]?\s*(\d{1,2})/i);
  return match ? `CLASS ${match[1]}` : value || 'CLASS';
}

function teacherAvatar(teacher: Teacher, index: number) {
  if (teacher.avatarUrl) return formatDriveImageUrl(teacher.avatarUrl);
  const seed = encodeURIComponent(`grav-academy-teacher-${teacher._id || index}`);
  return `https://api.dicebear.com/9.x/personas/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

export default function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { isFeatureEnabled } = useSiteSettings();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrolledBatchIds, setEnrolledBatchIds] = useState<string[]>([]);
  const [pendingRequestBatchIds, setPendingRequestBatchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBatchPicker, setShowBatchPicker] = useState(false);
  const [expandedSyllabus, setExpandedSyllabus] = useState<number | null>(null);
  const [showAllTeachers, setShowAllTeachers] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const courseRes = await api.get(`/courses/${resolvedParams.id}`);
        const loaded = courseRes.data?.data;
        if (!loaded) return;
        setCourse(loaded);

        try {
          const batchRes = await api.get(`/batches?courseId=${loaded._id || resolvedParams.id}`);
          if (batchRes.data?.success) setBatches(batchRes.data.data || []);
        } catch (error) {
          console.warn('Batch data unavailable:', error);
        }

        if (user?.role === 'student') {
          try {
            const status = await api.get(`/enrollments/my-status?courseId=${loaded._id || resolvedParams.id}`);
            setEnrolledBatchIds(status.data?.enrolledBatchIds || []);
            const requests = await api.get('/enrollment-requests/my');
            setPendingRequestBatchIds(
              (requests.data?.data || [])
                .filter((request: any) => request.status === 'pending')
                .map((request: any) => request.batchId?._id || request.batchId),
            );
          } catch (error) {
            console.warn('Enrollment status unavailable:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load course:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [resolvedParams.id, user]);

  const startEnrollment = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/courses/${resolvedParams.id}`)}`);
      return;
    }
    if (batches.length === 0) return;
    setShowBatchPicker(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f3f8fc] flex items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-blue-600" /></div>;
  }

  if (!course) {
    return <div className="min-h-screen bg-[#f3f8fc] flex items-center justify-center text-sm font-bold text-slate-600">কোর্সটি পাওয়া যায়নি।</div>;
  }

  const hasDiscount = Boolean(course.discountPrice && course.regularPrice && course.regularPrice > course.discountPrice);
  const price = hasDiscount ? course.discountPrice : course.regularPrice || course.courseFee;
  const benefits = (course.features?.length ? course.features : course.curriculumHighlights?.length ? course.curriculumHighlights : [
    'অভিজ্ঞ শিক্ষক ও মেন্টরদের সাথে গোছানো প্রস্তুতি',
    'লাইভ ক্লাস, রেকর্ডেড ক্লাস ও স্মার্ট নোটস',
    'অধ্যায়ভিত্তিক MCQ, CQ ও মডেল টেস্ট',
    'ফলাফল বিশ্লেষণ ও নিয়মিত progress tracking',
    'ডাউট সলভিং ও revision support',
  ]).map(cleanBenefit).slice(0, 6);
  const teachers = course.instructors?.length ? course.instructors : [
    { _id: 'dummy-1', name: 'প্রধান মেন্টর', email: '', role: 'teacher' },
    { _id: 'dummy-2', name: 'বিষয়ভিত্তিক শিক্ষক', email: '', role: 'teacher' },
    { _id: 'dummy-3', name: 'একাডেমিক মেন্টর', email: '', role: 'teacher' },
    { _id: 'dummy-4', name: 'সাপোর্ট মেন্টর', email: '', role: 'teacher' },
  ] as Teacher[];
  const syllabus = course.syllabus?.length ? course.syllabus : fallbackSyllabus;
  const visibleTeachers = showAllTeachers ? teachers.slice(0, 8) : teachers.slice(0, 4);
  const teacherMeta = ['গণিত · ৮+ বছর', 'পদার্থবিজ্ঞান · ৭+ বছর', 'রসায়ন · ৬+ বছর', 'ইংরেজি · ৯+ বছর'];
  const syllabusIcons = [BookMarked, BookMarked, Languages, Languages, Monitor, Calculator, Atom, FlaskConical, Landmark, PenTool];
  const syllabusIconStyles = [
    'bg-rose-100 text-rose-500',
    'bg-rose-100 text-rose-500',
    'bg-teal-100 text-teal-600',
    'bg-teal-100 text-teal-600',
    'bg-cyan-100 text-cyan-600',
    'bg-orange-100 text-orange-600',
    'bg-emerald-100 text-emerald-600',
    'bg-violet-100 text-violet-600',
    'bg-amber-100 text-amber-600',
    'bg-blue-100 text-blue-600',
  ];

  return (
    <main className="min-h-screen bg-[#f3f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="relative overflow-hidden cosmic-hero-bg pb-14 pt-8 text-white shadow-lg sm:pb-16 sm:pt-10">
        <div className="absolute left-1/2 top-0 h-[380px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-rose-950/45 via-red-950/20 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-[250px] w-[750px] -translate-x-1/2 animate-atmosphere rounded-full bg-red-600/15 blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute left-[10%] top-[16%] h-1 w-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute right-[12%] top-[24%] h-1.5 w-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
          <div className="absolute right-[30%] top-[12%] h-1 w-1 rounded-full bg-sky-200 animate-star-twinkle-medium" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-end">
            {(['superadmin', 'admin'].includes(user?.role || '')) && (
              <Link href={`/admin/courses/${course._id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"><Edit className="h-3.5 w-3.5" /> Edit</Link>
            )}
          </div>
          <div className="grid items-center gap-7 lg:grid-cols-[310px_1fr] lg:gap-10">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/20 bg-slate-900/50 shadow-2xl">
              {course.thumbnailUrl ? (
                <img src={formatDriveImageUrl(course.thumbnailUrl)} alt={course.title} className="h-full w-full object-cover" />
              ) : (
                <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-300 via-indigo-500 to-[#15183d] p-5 text-center">
                  <div className="absolute -left-10 -top-10 h-40 w-56 rounded-full bg-cyan-200/35 blur-3xl" />
                  <div className="absolute -right-10 top-6 h-40 w-56 rounded-full bg-violet-300/40 blur-3xl" />
                  <span className="relative rounded-sm bg-[#122f68] px-3 py-1 text-sm font-black leading-tight tracking-wide text-amber-300">{courseProgram(course.gradeLevel).split(' ').map((word) => <span key={word} className="block">{word}</span>)}</span>
                  <span className="relative mt-1 rounded-sm bg-pink-600 px-3 py-1 text-lg font-black leading-none text-white">{classLabel(course.gradeLevel)}</span>
                  <span className="relative mt-2 text-xs font-bold text-white">Grav Academy</span>
                </div>
              )}
            </div>
            <div>
              <p className="mb-3 text-xs font-bold tracking-wide text-blue-200">{course.gradeLevel} · ACADEMIC PROGRAM</p>
              <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">{course.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-50/90 sm:text-base">{course.description || 'সম্পূর্ণ সিলেবাস কভার করে পরিকল্পিত একাডেমিক প্রস্তুতি।'}</p>
              <button type="button" className="mt-4 text-xs font-bold text-white underline underline-offset-4">বিস্তারিত দেখুন</button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-7 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
          <Stat icon={<Users className="h-5 w-5 text-violet-600" />} label="কোর্সের শিক্ষক" value={`${teachers.length} জন`} />
          <Stat icon={<Clock3 className="h-5 w-5 text-emerald-600" />} label="ক্লাস চলবে" value={course.duration || 'পূর্ণাঙ্গ সেশন'} />
          <Stat icon={<CalendarDays className="h-5 w-5 text-orange-500" />} label="কোর্স এক্সেস" value="সম্পূর্ণ সেশন" />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-7 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-7">
          <section className="rounded-[28px] bg-transparent p-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Grav Academy</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">শিক্ষকবৃন্দ</h2>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{teachers.length} জন</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {visibleTeachers.map((teacher, index) => {
                const surface = [
                  'from-rose-100 via-fuchsia-50 to-white dark:from-rose-950/60 dark:via-fuchsia-950/30 dark:to-slate-900',
                  'from-amber-100 via-orange-50 to-white dark:from-amber-950/60 dark:via-orange-950/30 dark:to-slate-900',
                  'from-sky-100 via-cyan-50 to-white dark:from-sky-950/60 dark:via-cyan-950/30 dark:to-slate-900',
                  'from-emerald-100 via-teal-50 to-white dark:from-emerald-950/60 dark:via-teal-950/30 dark:to-slate-900',
                ][index % 4];
                return <article key={teacher._id} className="group min-w-0 text-center">
                  <div className={"relative aspect-[4/3] overflow-hidden rounded-[22px] bg-gradient-to-br " + surface}>
                    <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/40 blur-2xl dark:bg-white/10" />
                    <img src={teacherAvatar(teacher, index)} alt={teacher.name} className="relative h-full w-full object-contain object-bottom drop-shadow-md transition-transform duration-500 group-hover:scale-[1.04]" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-1 text-[9px] font-black text-slate-700 shadow-sm backdrop-blur dark:bg-slate-950/70 dark:text-slate-200">{teacherMeta[index % teacherMeta.length]}</span>
                  </div>
                  <h3 className="mt-3 truncate text-xs font-black text-slate-900 dark:text-white sm:text-sm">{teacher.name}</h3>
                  <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">{course.subject || 'Academic'} · Mentor</p>
                </article>;
              })}
            </div>
            {teachers.length > 4 && <button type="button" onClick={() => setShowAllTeachers((value) => !value)} className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-blue-200 px-4 py-2 text-xs font-black text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40">{showAllTeachers ? 'সংক্ষেপে' : 'আরো দেখুন'} <ChevronDown className={showAllTeachers ? 'h-3.5 w-3.5 rotate-180 transition-transform' : 'h-3.5 w-3.5 transition-transform'} /></button>}
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">প্রোগ্রামের সিলেবাস</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{syllabus.length}টি বিষয়</span>
            </div>
            <div className="mt-5 space-y-3">
              {syllabus.map((item, index) => {
                const open = expandedSyllabus === index;
                const SyllabusIcon = syllabusIcons[index % syllabusIcons.length];
                return <div key={item.title + '-new-' + index} className={open ? 'overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(30,65,100,0.12)] ring-1 ring-blue-200 dark:bg-slate-900 dark:ring-blue-900' : 'overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(30,65,100,0.08)] dark:bg-slate-900'}>
                  <button type="button" onClick={() => setExpandedSyllabus(open ? null : index)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:px-6">
                    <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-none " + syllabusIconStyles[index % syllabusIconStyles.length]}><SyllabusIcon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-900 dark:text-white">{item.title}</span></span>
                    <ChevronDown className={open ? 'h-4 w-4 shrink-0 rotate-180 text-blue-600 transition-transform' : 'h-4 w-4 shrink-0 text-slate-400 transition-transform'} />
                  </button>
                  {open && <div className="flex gap-3 border-t border-slate-100 px-5 pb-5 pt-3 text-xs leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:px-6"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />{item.details}</div>}
                </div>;
              })}
            </div>
          </section>

          <section className="rounded-[22px]">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">প্রোগ্রামের ক্লাস রুটিন ও প্রসপেক্টাস</h2>
            <div className="mt-5 overflow-hidden rounded-[22px] shadow-[0_10px_28px_rgba(30,65,100,0.12)]">
              <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-[#020b2b] bg-gradient-to-br from-[#06103f] via-[#073b9e] to-[#020817] px-6 text-center sm:min-h-[260px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(24,142,255,0.78),transparent_38%),radial-gradient(circle_at_15%_20%,rgba(0,92,255,0.28),transparent_28%),radial-gradient(circle_at_86%_20%,rgba(0,220,255,0.18),transparent_25%)]" />
                <div className="absolute -bottom-24 left-[-8%] h-36 w-[120%] rotate-[-8deg] bg-blue-950/80 shadow-[0_-8px_30px_rgba(24,164,255,0.55)]" />
                <div className="absolute -bottom-20 left-[-8%] h-24 w-[120%] rotate-[6deg] bg-cyan-500/60" />
                <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:32px_32px]" />
                <div className="relative">
                  <CalendarDays className="mx-auto h-10 w-10 text-cyan-200" />
                  <p className="mt-4 text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.28)] sm:text-6xl">রুটিন শীঘ্রই আসছে</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 bg-gradient-to-r from-[#e3f7fa] via-[#f4f5e2] to-[#ffe8bd] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-9">
                <p className="text-sm font-bold text-slate-700 sm:text-base">ক্লাস ৬ - SSC '32</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="rounded-xl bg-[#3555ee] px-5 py-3 text-xs font-black text-white shadow-sm transition hover:bg-[#2946da]">ডাউনলোড ক্লাস রুটিন</button>
                  <button type="button" className="rounded-xl bg-[#e60087] px-5 py-3 text-xs font-black text-white shadow-sm transition hover:bg-[#c90076]">ডাউনলোড প্রসপেক্টাস</button>
                </div>
              </div>
            </div>
          </section>

          <section className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid items-center gap-5 bg-gradient-to-br from-[#eef7ff] via-white to-[#f2edff] p-5 sm:grid-cols-[1fr_210px] sm:p-7 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300"><CalendarDays className="h-3.5 w-3.5" /> Course plan</span>
                <h2 className="mt-3 text-xl font-black text-slate-900 dark:text-white">প্রোগ্রামের ক্লাস রুটিন ও প্রসপেক্টাস</h2>
                <p className="mt-2 max-w-lg text-xs leading-6 text-slate-600 dark:text-slate-300">ক্লাসের সময়সূচি, প্রস্তুতি ও কোর্সের গাইডলাইন এক জায়গায় রাখার জন্য এই sectionটি তৈরি করা হয়েছে।</p>
                <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-700">রুটিন দেখুন</button><button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">প্রসপেক্টাস</button></div>
              </div>
              <div className="relative mx-auto flex h-36 w-full max-w-[210px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-lg"><div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-300/30 blur-2xl" /><div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-fuchsia-300/30 blur-2xl" /><BookOpen className="relative h-14 w-14 text-white/90" /></div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[22px] bg-gradient-to-r from-[#dff7fb] via-[#f2f4de] to-[#ffe5b7] shadow-[0_10px_28px_rgba(30,65,100,0.1)]">
            <div className="grid items-center sm:grid-cols-[1fr_220px]">
              <div className="p-6 sm:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">Grav Academy support</p>
                <h2 className="mt-3 text-2xl font-black text-[#24478f]">যেকোনো প্রয়োজনে কল করো এখনই</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#31558e]">শিক্ষার কোর্স, পড়াশোনা, ভর্তি অথবা যেকোনো জিজ্ঞাসায় কথা বলো।</p>
                <p className="mt-4 border-l-4 border-amber-400 pl-3 text-sm font-black text-[#31558e]">সকাল ৮টা - রাত ১০টা</p>
                <a href="tel:16910" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#5269f4] px-6 py-3 text-base font-black text-white shadow-md transition hover:bg-[#4056df]"><Phone className="h-5 w-5" /> ১৬৯১০</a>
                <p className="mt-2 text-[10px] text-[#31558e]">* যেকোনো নম্বর থেকে সাধারণ কল রেট প্রযোজ্য *</p>
              </div>
              <div className="relative h-52 self-end overflow-hidden sm:h-64">
                <img src="/images/hero-student.jpg" alt="Grav Academy student support" className="absolute inset-0 h-full w-full object-cover object-[65%_20%] mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#eaf5df]/95 via-transparent to-transparent sm:from-[#eaf5df]/40" />
              </div>
            </div>
          </section>

          <section className="hidden grid gap-4 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#122b63] via-[#173e88] to-[#4169d8] p-6 text-white shadow-sm">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
              <p className="relative text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">Support</p>
              <h2 className="relative mt-3 text-xl font-black">যেকোনো প্রয়োজনে কথা বলুন</h2>
              <p className="relative mt-2 text-xs leading-6 text-blue-100">ভর্তি, কোর্স বা পড়াশোনা নিয়ে সাহায্য দরকার?</p>
              <a href="tel:16910" className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-blue-700 shadow-sm"><Phone className="h-4 w-4" /> ১৬৯১০</a>
            </div>
            <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Learning extras</p>
              <h2 className="mt-3 text-xl font-black text-slate-900 dark:text-white">আরও শেখার সুযোগ</h2>
              <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">ভিডিও, নোট ও practice materials ধাপে ধাপে যোগ হবে।</p>
              <div className="mt-5 flex flex-wrap gap-2"><button type="button" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700">ভিডিও দেখুন</button><button type="button" className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">সাপোর্ট</button></div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <GraduationCap className="mx-auto h-8 w-8 text-blue-600" />
            <h2 className="mt-3 text-lg font-black text-slate-900 dark:text-white">আপনার শেখার যাত্রা শুরু করুন</h2>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-600 dark:text-slate-300">একটি batch বেছে নিয়ে আজই course request পাঠান।</p>
            <button type="button" onClick={startEnrollment} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-sm hover:bg-blue-700">এনরোল করুন <ArrowRight className="ml-1 inline h-4 w-4" /></button>
          </section>

          <section className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">কোর্সের শিক্ষকবৃন্দ</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {teachers.slice(0, 8).map((teacher, index) => {
                const surface = ['bg-rose-100 dark:bg-rose-950/50', 'bg-amber-100 dark:bg-amber-950/50', 'bg-sky-100 dark:bg-sky-950/50', 'bg-emerald-100 dark:bg-emerald-950/50'][index % 4];
                return <div key={teacher._id} className="group text-center">
                  <div className={`flex aspect-[4/3] items-end justify-center overflow-hidden rounded-2xl ${surface}`}>
                    <img src={teacherAvatar(teacher, index)} alt={teacher.name} className="h-full w-full object-contain object-bottom drop-shadow-sm transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <h3 className="mt-2 line-clamp-1 text-xs font-black text-slate-900 dark:text-white sm:text-sm">{teacher.name}</h3>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{course.subject || 'Academic'} · Mentor</p>
                </div>;
              })}
            </div>
            {teachers.length > 8 && <button type="button" className="mt-5 text-xs font-bold text-blue-600 hover:underline">আরো দেখুন</button>}
          </section>

          <section className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">প্রোগ্রামের সিলেবাস</h2>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {syllabus.map((item, index) => {
                const open = expandedSyllabus === index;
                return <div key={`${item.title}-${index}`} className={`overflow-hidden rounded-2xl border transition-colors ${open ? 'border-blue-300 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/30' : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/50'}`}>
                  <button type="button" onClick={() => setExpandedSyllabus(open ? null : index)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-800"><Layers3 className="h-4 w-4" /></span>
                    <span className="flex-1 text-xs font-black text-slate-800 dark:text-slate-100">{item.title}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>
                  {open && <div className="border-t border-blue-200/70 px-4 pb-4 pt-3 text-xs leading-relaxed text-slate-600 dark:border-blue-900 dark:text-slate-300">{item.details}</div>}
                </div>;
              })}
            </div>
          </section>

          <section className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">প্রোগ্রামের ক্লাস রুটিন ও প্রসপেক্টাস</h2>
            <div className="mt-4 flex min-h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-center dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950">
              <div><CalendarDays className="mx-auto h-9 w-9 text-blue-500" /><p className="mt-2 text-sm font-black text-slate-700 dark:text-slate-200">রুটিন শীঘ্রই যুক্ত হবে</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">প্রকাশ হলে এখানে দেখা যাবে।</p></div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">কোর্স ফি</p>
              <div className="mt-1 flex items-baseline gap-2">
                {price ? <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">৳{price.toLocaleString('bn-BD')}</span> : <span className="text-2xl font-black text-emerald-600">ফ্রি কোর্স</span>}
                {hasDiscount && <><span className="text-sm text-slate-400 line-through">৳{course.regularPrice?.toLocaleString('bn-BD')}</span><span className="rounded-full bg-pink-100 px-2 py-1 text-[10px] font-black text-pink-600">অফার</span></>}
              </div>
              <button type="button" onClick={startEnrollment} disabled={Boolean(user?.role && !['student'].includes(user.role))} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">প্রোগ্রামে ভর্তি হও <ArrowRight className="ml-1 inline h-4 w-4" /></button>
            </div>
            <div className="p-6 sm:p-7">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">এই কোর্সে যা থাকছে</h2>
              <div className="mt-4 space-y-3">
                {benefits.map((benefit, index) => <div key={index} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{benefit}</div>)}
              </div>
              <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800"><div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" /> Payment এখনই লাগবে না; request review-এর পর admin যোগাযোগ করবে।</div></div>
              <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400"><Phone className="h-3.5 w-3.5" /> ১৬৯১০ · <Mail className="h-3.5 w-3.5" /> support</div>
            </div>
          </div>
        </aside>
      </section>

      {showBatchPicker && <BatchPicker batches={batches} enrolledBatchIds={enrolledBatchIds} pendingRequestBatchIds={pendingRequestBatchIds} onClose={() => setShowBatchPicker(false)} onSelect={(batch) => router.push(`/enroll/${batch._id}/request`)} />}
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 border-slate-100 px-5 py-4 sm:border-r dark:border-slate-800"><span>{icon}</span><div><span className="block text-[11px] text-slate-500 dark:text-slate-400">{label}</span><strong className="text-sm text-slate-900 dark:text-white">{value}</strong></div></div>;
}

function BatchPicker({ batches, enrolledBatchIds, pendingRequestBatchIds, onClose, onSelect }: { batches: Batch[]; enrolledBatchIds: string[]; pendingRequestBatchIds: string[]; onClose: () => void; onSelect: (batch: Batch) => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"><button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button><p className="text-xs font-bold text-blue-600">এনরোলমেন্ট</p><h2 className="mt-1 pr-8 text-xl font-black text-slate-900 dark:text-white">আপনার batch বেছে নিন</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">একটি batch নির্বাচন করলে request form খুলবে।</p><div className="mt-5 space-y-3">{batches.map((batch) => { const joined = enrolledBatchIds.includes(batch._id); const pending = pendingRequestBatchIds.includes(batch._id); return <div key={batch._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-black text-slate-900 dark:text-white">{batch.name}</h3><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">Active</span></div>{batch.scheduleText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{batch.scheduleText}</p>}{joined ? <Link href={`/classroom/${batch._id}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white">ক্লাসরুমে যান <ArrowRight className="h-3.5 w-3.5" /></Link> : pending ? <button type="button" disabled className="mt-3 w-full rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-black text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Request pending</button> : <button type="button" onClick={() => onSelect(batch)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white hover:bg-blue-700">এই batch বেছে নিন <ArrowRight className="h-3.5 w-3.5" /></button>}</div>; })}</div></div></div>;
}
