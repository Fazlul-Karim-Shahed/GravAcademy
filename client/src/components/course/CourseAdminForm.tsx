'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Button, DriveFileUpload } from '@/components/ui';
import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';
import { AVAILABLE_FEATURE_ICONS, parseFeatureItem } from '@/components/course/CourseCardFeatures';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  Link2,
  ListFilter,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';

interface TeacherUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
}

interface SyllabusItem {
  title: string;
  details: string;
  contentLines?: string[];
  demoTitle?: string;
  demoUrl?: string;
}

interface CourseRoutine {
  title: string;
  bannerText: string;
  programLabel: string;
  routineUrl: string;
  prospectusUrl: string;
}

interface SupportSection {
  title: string;
  description: string;
  hours: string;
  phone: string;
  note: string;
  imageUrl: string;
}

interface PromoCard {
  key: 'video' | 'facebook';
  eyebrow: string;
  title: string;
  buttonLabel: string;
  buttonUrl: string;
}

interface CourseFormData {
  title: string;
  thumbnailUrl: string;
  description: string;
  gradeLevel: string;
  subject: string;
  courseFee: number;
  regularPrice: number;
  discountPrice: number;
  duration: string;
  targetAudience: string;
  heroEyebrow: string;
  accessLabel: string;
  isPublished: boolean;
  instructors: string[];
  curriculumHighlights: string[];
  syllabus: SyllabusItem[];
  routine: CourseRoutine;
  supportSection: SupportSection;
  promoCards: PromoCard[];
}

const defaultHighlights = [
  'icon:play|লাইভ ক্লাস ও সার্বক্ষণিক ডাউট সলভ',
  'icon:sheet|অধ্যায়ভিত্তিক লেকচার শিট ও নোট',
  'icon:exam|অনলাইন উইকলি টেস্ট ও এনালাইসিস',
];

const DEFAULT_DEMO_TITLE = 'এখনই ফ্রী ডেমো দেখুন';

const defaultSyllabus: SyllabusItem[] = [
  {
    title: 'প্রথম বিষয়',
    details: 'অধ্যায়ভিত্তিক ক্লাস ও concept clear\nনিয়মিত practice ও মূল্যায়ন',
    contentLines: ['অধ্যায়ভিত্তিক ক্লাস ও concept clear', 'নিয়মিত practice ও মূল্যায়ন'],
    demoTitle: DEFAULT_DEMO_TITLE,
    demoUrl: '',
  },
  {
    title: 'দ্বিতীয় বিষয়',
    details: 'গুরুত্বপূর্ণ topic ও exam preparation\nপ্রশ্ন সমাধান ও revision',
    contentLines: ['গুরুত্বপূর্ণ topic ও exam preparation', 'প্রশ্ন সমাধান ও revision'],
    demoTitle: DEFAULT_DEMO_TITLE,
    demoUrl: '',
  },
];

const defaultRoutine: CourseRoutine = {
  title: 'প্রোগ্রামের ক্লাস রুটিন ও প্রসপেক্টাস',
  bannerText: 'রুটিন শীঘ্রই আসছে',
  programLabel: 'Academic Program',
  routineUrl: '',
  prospectusUrl: '',
};

const defaultSupport: SupportSection = {
  title: 'যেকোনো প্রয়োজনে কল করো এখনই',
  description: 'শিক্ষার কোর্স, পড়াশোনা, ভর্তি অথবা যেকোনো জিজ্ঞাসায় কথা বলো।',
  hours: 'সকাল ৮টা - রাত ১০টা',
  phone: '16910',
  note: '* যেকোনো নম্বর থেকে সাধারণ কল রেট প্রযোজ্য *',
  imageUrl: '',
};

const defaultPromos: PromoCard[] = [
  { key: 'video', eyebrow: 'Learning', title: 'ফ্রি ভিডিও লাইব্রেরি', buttonLabel: 'ভিডিও দেখুন', buttonUrl: '/free-classes' },
  { key: 'facebook', eyebrow: 'Community', title: 'Grav Academy ফেসবুক গ্রুপ', buttonLabel: 'গ্রুপে যুক্ত হন', buttonUrl: 'https://www.facebook.com/' },
];

function getDefaultForm(): CourseFormData {
  return {
    title: '',
    thumbnailUrl: '',
    description: '',
    gradeLevel: 'Class 10',
    subject: '',
    courseFee: 2500,
    regularPrice: 3500,
    discountPrice: 2500,
    duration: '1 Year',
    targetAudience: '',
    heroEyebrow: 'ACADEMIC PROGRAM',
    accessLabel: 'সীমাহীন সেশন',
    isPublished: true,
    instructors: [],
    curriculumHighlights: defaultHighlights,
    syllabus: defaultSyllabus,
    routine: { ...defaultRoutine },
    supportSection: { ...defaultSupport },
    promoCards: defaultPromos.map((card) => ({ ...card })),
  };
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function hydrateForm(course: any): CourseFormData {
  const base = getDefaultForm();
  const instructorIds = (course.instructors || []).map((item: any) => String(item?._id || item));

  return {
    ...base,
    title: asString(course.title),
    thumbnailUrl: asString(course.thumbnailUrl),
    description: asString(course.description),
    gradeLevel: asString(course.gradeLevel, base.gradeLevel),
    subject: asString(course.subject),
    courseFee: Number(course.courseFee) || 0,
    regularPrice: course.regularPrice !== undefined ? Number(course.regularPrice) || 0 : Number(course.courseFee) || 0,
    discountPrice: course.discountPrice !== undefined ? Number(course.discountPrice) || 0 : Number(course.courseFee) || 0,
    duration: asString(course.duration, base.duration),
    targetAudience: asString(course.targetAudience),
    heroEyebrow: asString(course.heroEyebrow, base.heroEyebrow),
    accessLabel: asString(course.accessLabel, base.accessLabel),
    isPublished: course.isPublished ?? true,
    instructors: instructorIds,
    curriculumHighlights: Array.isArray(course.features) && course.features.length
      ? course.features
      : Array.isArray(course.curriculumHighlights) && course.curriculumHighlights.length
        ? course.curriculumHighlights
        : base.curriculumHighlights,
    syllabus: Array.isArray(course.syllabus)
      ? course.syllabus.map((item: any) => ({
          title: asString(item.title),
          details: asString(item.details),
          contentLines: Array.isArray(item.contentLines) && item.contentLines.length
            ? item.contentLines.map((line: unknown) => asString(line)).filter(Boolean)
            : asString(item.details).split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
          demoTitle: asString(item.demoTitle) || DEFAULT_DEMO_TITLE,
          demoUrl: asString(item.demoUrl),
        }))
      : base.syllabus,
    routine: { ...base.routine, ...(course.routine || {}) },
    supportSection: { ...base.supportSection, ...(course.supportSection || {}) },
    promoCards: defaultPromos.map((defaultCard) => ({
      ...defaultCard,
      ...(Array.isArray(course.promoCards) ? course.promoCards.find((card: any) => card.key === defaultCard.key) : undefined),
    })),
  };
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const labelClass = 'mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300';

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block"><span className={labelClass}>{label}</span>{children}{hint && <span className="mt-1 block text-[11px] leading-5 text-slate-400">{hint}</span>}</label>;
}

function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  return <section className="border-0 bg-transparent p-0 shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-6 sm:shadow-sm sm:dark:border-slate-800 sm:dark:bg-slate-900"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">{icon}</span><div><h2 className="text-sm font-black text-slate-900 dark:text-white">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>}</div></div><div className="mt-5">{children}</div></section>;
}

export default function CourseAdminForm({ mode, courseId }: { mode: 'create' | 'edit'; courseId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CourseFormData>(() => getDefaultForm());
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClassItem[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [newHighlightIcon, setNewHighlightIcon] = useState('play');
  const [newSyllabusTitle, setNewSyllabusTitle] = useState('');
  const [newSyllabusDetails, setNewSyllabusDetails] = useState('');
  const [newSyllabusDemoTitle, setNewSyllabusDemoTitle] = useState(DEFAULT_DEMO_TITLE);
  const [newSyllabusDemoUrl, setNewSyllabusDemoUrl] = useState('');

  const gradeOptions = useMemo(() => {
    const options = academicClasses.map((item) => item.name);
    return options.includes(form.gradeLevel) || !form.gradeLevel ? options : [form.gradeLevel, ...options];
  }, [academicClasses, form.gradeLevel]);

  useEffect(() => {
    const load = async () => {
      setLoading(mode === 'edit');
      try {
        const requests: Promise<any>[] = [api.get('/users'), getSharedAcademicClasses()];
        if (mode === 'edit' && courseId) requests.push(api.get(`/courses/${courseId}`));
        const [usersRes, classList, courseRes] = await Promise.all(requests);
        setAcademicClasses(classList || []);
        if (usersRes.data?.success) setTeachers(usersRes.data.data.filter((item: TeacherUser) => ['teacher', 'admin', 'superadmin'].includes(item.role)));
        if (mode === 'edit' && courseRes?.data?.success) setForm(hydrateForm(courseRes.data.data));
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Course details load করা যায়নি।');
      } finally {
        setLoading(false);
        setLoadingTeachers(false);
      }
    };
    load();
  }, [mode, courseId]);

  const update = <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => setForm((current) => ({ ...current, [key]: value }));

  const toggleTeacher = (teacherId: string) => {
    setForm((current) => ({
      ...current,
      instructors: current.instructors.includes(teacherId)
        ? current.instructors.filter((id) => id !== teacherId)
        : [...current.instructors, teacherId],
    }));
  };

  const updateNested = <K extends keyof CourseRoutine>(key: K, value: CourseRoutine[K]) => setForm((current) => ({ ...current, routine: { ...current.routine, [key]: value } }));
  const updateSupport = <K extends keyof SupportSection>(key: K, value: SupportSection[K]) => setForm((current) => ({ ...current, supportSection: { ...current.supportSection, [key]: value } }));
  const updatePromo = (index: number, key: keyof PromoCard, value: string) => setForm((current) => ({ ...current, promoCards: current.promoCards.map((card, cardIndex) => cardIndex === index ? { ...card, [key]: value } : card) }));

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    update('curriculumHighlights', [...form.curriculumHighlights, `icon:${newHighlightIcon}|${newHighlight.trim()}`]);
    setNewHighlight('');
  };
  const addSyllabus = () => {
    if (!newSyllabusTitle.trim()) return;
    const contentLines = newSyllabusDetails.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    update('syllabus', [...form.syllabus, {
      title: newSyllabusTitle.trim(),
      details: contentLines.join('\n'),
      contentLines,
      demoTitle: newSyllabusDemoTitle.trim(),
      demoUrl: newSyllabusDemoUrl.trim(),
    }]);
    setNewSyllabusTitle('');
    setNewSyllabusDetails('');
    setNewSyllabusDemoTitle(DEFAULT_DEMO_TITLE);
    setNewSyllabusDemoUrl('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    const payload = {
      ...form,
      courseFee: Number(form.courseFee) || 0,
      regularPrice: Number(form.regularPrice) || 0,
      discountPrice: Number(form.discountPrice) || 0,
      instructors: form.instructors,
      instructorProfiles: [],
      features: [],
    };
    try {
      const response = mode === 'create' ? await api.post('/courses', payload) : await api.put(`/courses/${courseId}`, payload);
      if (response.data?.success) {
        setSuccess(mode === 'create' ? 'Course তৈরি হয়েছে।' : 'Course update হয়েছে।');
        setTimeout(() => router.push('/admin/courses'), 900);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Course save করা যায়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="h-10 w-10 animate-spin rounded-2xl border-2 border-blue-200 border-t-blue-600" /></div>;

  return <div className="min-h-screen bg-slate-50 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-10">
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-center justify-between gap-3"><Link href="/admin/courses" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600"><ArrowLeft className="h-4 w-4" /> Courses</Link><span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{mode === 'create' ? 'New course' : 'Edit course'}</span></div>
      <div className="mb-7"><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Course content</p><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{mode === 'create' ? 'Create course' : 'Edit course'}</h1><p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Course details page-এ যা যা দেখা যায়, এখান থেকেই সব content manage করুন।</p></div>
      {error && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
      {success && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5 shrink-0" />{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section icon={<ImageIcon className="h-4 w-4" />} title="Basic information" description="Hero section, pricing এবং course identity এখান থেকে control করুন।">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Course title *"><input required className={inputClass} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Class 10 Physics Masterclass" /></Field>
            <Field label="Class / grade *"><select required className={inputClass} value={form.gradeLevel} onChange={(event) => update('gradeLevel', event.target.value)}>{(gradeOptions.length ? gradeOptions : [form.gradeLevel]).map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Subject"><input className={inputClass} value={form.subject} onChange={(event) => update('subject', event.target.value)} placeholder="Physics" /></Field>
            <Field label="Duration"><input className={inputClass} value={form.duration} onChange={(event) => update('duration', event.target.value)} placeholder="1 Year" /></Field>
            <Field label="Hero eyebrow"><input className={inputClass} value={form.heroEyebrow} onChange={(event) => update('heroEyebrow', event.target.value)} placeholder="ACADEMIC PROGRAM" /></Field>
            <Field label="Access label"><input className={inputClass} value={form.accessLabel} onChange={(event) => update('accessLabel', event.target.value)} placeholder="সীমাহীন সেশন" /></Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Course description"><textarea rows={4} className={inputClass} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Course overview..." /></Field><Field label="Target audience"><textarea rows={4} className={inputClass} value={form.targetAudience} onChange={(event) => update('targetAudience', event.target.value)} placeholder="কারা এই course-এর জন্য উপযুক্ত..." /></Field></div>
          <div className="mt-4"><DriveFileUpload label="Course thumbnail" value={form.thumbnailUrl} onChange={(url) => update('thumbnailUrl', url)} placeholder="Drive link বা file upload করুন" helperText="খালি রাখলে class-based default thumbnail দেখাবে।" /></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Regular price"><input type="number" min="0" className={inputClass} value={form.regularPrice || ''} onChange={(event) => update('regularPrice', Number(event.target.value) || 0)} /></Field><Field label="Discount price"><input type="number" min="0" className={inputClass} value={form.discountPrice || ''} onChange={(event) => update('discountPrice', Number(event.target.value) || 0)} /></Field><Field label="Course fee" hint="Enrollment-এর default fee হিসেবে ব্যবহৃত হবে।"><input type="number" min="0" className={inputClass} value={form.courseFee || ''} onChange={(event) => update('courseFee', Number(event.target.value) || 0)} /></Field></div>
        </Section>

        <Section icon={<Users className="h-4 w-4" />} title="Course teachers" description="Teacher select করুন। Subject ও experience teacher-এর profile থেকে দেখানো হবে।">
          {loadingTeachers ? <p className="text-xs text-slate-400">Teacher list load হচ্ছে...</p> : teachers.length === 0 ? <p className="text-xs text-slate-400">কোনো teacher পাওয়া যায়নি।</p> : <div className="grid gap-3 sm:grid-cols-2">{teachers.map((teacher) => { const selected = form.instructors.includes(teacher._id); return <label key={teacher._id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${selected ? 'border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30' : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50'}`}><span className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-black text-white">{teacher.avatarUrl ? <img src={teacher.avatarUrl} alt="" className="h-full w-full object-cover" /> : teacher.name.slice(0, 1)}</span><span className="min-w-0"><span className="block truncate text-xs font-black">{teacher.name}</span><span className="block truncate text-[11px] text-slate-500">{teacher.role} · {teacher.email}</span></span></span><input type="checkbox" checked={selected} onChange={() => toggleTeacher(teacher._id)} className="h-4 w-4 accent-blue-600" /></label>; })}</div>}
        </Section>

        <Section icon={<BookOpen className="h-4 w-4" />} title="Program syllabus" description="প্রতিটি বিষয়ের একাধিক লাইন ও চাইলে free demo class যোগ করুন।">
          <div className="space-y-4">
            {form.syllabus.map((item, index) => {
              const lineValue = item.contentLines?.length ? item.contentLines.join('\n') : item.details;
              return <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-start gap-3">
                  <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
                    <label className="block md:col-span-2"><span className="mb-1.5 block text-[11px] font-black text-slate-500">বিষয়ের নাম</span><input className={inputClass} value={item.title} onChange={(event) => update('syllabus', form.syllabus.map((current, itemIndex) => itemIndex === index ? { ...current, title: event.target.value } : current))} placeholder="যেমন: গণিত" /></label>
                    <label className="block md:col-span-2"><span className="mb-1.5 block text-[11px] font-black text-slate-500">কনটেন্ট</span><textarea className={`${inputClass} min-h-28 resize-y py-3`} value={lineValue} onChange={(event) => { const details = event.target.value; update('syllabus', form.syllabus.map((current, itemIndex) => itemIndex === index ? { ...current, details, contentLines: details.split(/\r?\n/) } : current)); }} placeholder={'প্রতি লাইনে একটি বিষয় লিখুন\nযেমন: অধ্যায়ভিত্তিক ক্লাস\nসাপ্তাহিক practice'} /></label>
                    <label className="block"><span className="mb-1.5 block text-[11px] font-black text-slate-500">Demo title <span className="font-medium">(optional)</span></span><input className={inputClass} value={item.demoTitle || ''} onChange={(event) => update('syllabus', form.syllabus.map((current, itemIndex) => itemIndex === index ? { ...current, demoTitle: event.target.value } : current))} placeholder="ফ্রি ডেমো ক্লাস" /></label>
                    <label className="block"><span className="mb-1.5 block text-[11px] font-black text-slate-500">Demo link <span className="font-medium">(optional)</span></span><input className={inputClass} value={item.demoUrl || ''} onChange={(event) => update('syllabus', form.syllabus.map((current, itemIndex) => itemIndex === index ? { ...current, demoUrl: event.target.value } : current))} placeholder="https://..." /></label>
                  </div>
                  <button type="button" aria-label="Delete syllabus item" onClick={() => update('syllabus', form.syllabus.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>;
            })}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
            <div className="grid gap-3 md:grid-cols-2">
              <input className={`${inputClass} md:col-span-2`} value={newSyllabusTitle} onChange={(event) => setNewSyllabusTitle(event.target.value)} placeholder="নতুন বিষয়ের নাম" />
              <textarea className={`${inputClass} min-h-28 resize-y py-3 md:col-span-2`} value={newSyllabusDetails} onChange={(event) => setNewSyllabusDetails(event.target.value)} placeholder={'প্রতি লাইনে একটি কনটেন্ট লিখুন\nএকাধিক লাইন যোগ করা যাবে'} />
              <input className={inputClass} value={newSyllabusDemoTitle} onChange={(event) => setNewSyllabusDemoTitle(event.target.value)} placeholder="Demo title (optional)" />
              <input className={inputClass} value={newSyllabusDemoUrl} onChange={(event) => setNewSyllabusDemoUrl(event.target.value)} placeholder="Demo link (optional)" />
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addSyllabus} className="mt-3"><Plus className="mr-1 h-3.5 w-3.5" /> যোগ করুন</Button>
          </div>
        </Section>

        <Section icon={<ListFilter className="h-4 w-4" />} title="Student highlights" description="Course details page-এর ‘এই কোর্সে যা থাকছে’ তালিকা ও icon এখান থেকে control করুন।">
          <div className="space-y-3">{form.curriculumHighlights.map((item, index) => { const parsed = parseFeatureItem(item, index); return <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50 sm:grid-cols-[170px_minmax(0,1fr)_40px]"><select className={inputClass} value={parsed.iconKey} onChange={(event) => update('curriculumHighlights', form.curriculumHighlights.map((current, itemIndex) => itemIndex === index ? `icon:${event.target.value}|${parsed.text}` : current))}>{Object.entries(AVAILABLE_FEATURE_ICONS).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}</select><div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${parsed.colorBg} ${parsed.colorText}`}><parsed.IconComponent className="h-3.5 w-3.5" /></span><input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" value={parsed.text} onChange={(event) => update('curriculumHighlights', form.curriculumHighlights.map((current, itemIndex) => itemIndex === index ? `icon:${parsed.iconKey}|${event.target.value}` : current))} /></div><button type="button" aria-label="Highlight মুছুন" onClick={() => update('curriculumHighlights', form.curriculumHighlights.filter((_, itemIndex) => itemIndex !== index))} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button></div>; })}</div>
          <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700 sm:grid-cols-[170px_minmax(0,1fr)_auto]"><select className={inputClass} value={newHighlightIcon} onChange={(event) => setNewHighlightIcon(event.target.value)}>{Object.entries(AVAILABLE_FEATURE_ICONS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select><input className={inputClass} value={newHighlight} onChange={(event) => setNewHighlight(event.target.value)} placeholder="নতুন highlight" /><Button type="button" size="sm" variant="secondary" onClick={addHighlight}><Plus className="mr-1 h-3.5 w-3.5" /> যোগ করুন</Button></div>
        </Section>

        <Section icon={<CalendarDays className="h-4 w-4" />} title="Routine & prospectus" description="Course page-এর routine banner এবং download links manage করুন।">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Section title"><input className={inputClass} value={form.routine.title} onChange={(event) => updateNested('title', event.target.value)} /></Field><Field label="Banner text"><input className={inputClass} value={form.routine.bannerText} onChange={(event) => updateNested('bannerText', event.target.value)} /></Field><Field label="Program label"><input className={inputClass} value={form.routine.programLabel} onChange={(event) => updateNested('programLabel', event.target.value)} placeholder="Class 10 - SSC '32" /></Field><Field label="Routine link"><input type="url" className={inputClass} value={form.routine.routineUrl} onChange={(event) => updateNested('routineUrl', event.target.value)} placeholder="https://..." /></Field><Field label="Prospectus link"><input type="url" className={inputClass} value={form.routine.prospectusUrl} onChange={(event) => updateNested('prospectusUrl', event.target.value)} placeholder="https://..." /></Field></div>
        </Section>

        <Section icon={<Link2 className="h-4 w-4" />} title="Support & quick links" description="Support banner এবং নিচের দুইটি promo card-এর content এখান থেকে বদলান।">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Support title"><input className={inputClass} value={form.supportSection.title} onChange={(event) => updateSupport('title', event.target.value)} /></Field><Field label="Support phone"><input className={inputClass} value={form.supportSection.phone} onChange={(event) => updateSupport('phone', event.target.value)} /></Field><Field label="Support description"><textarea rows={3} className={inputClass} value={form.supportSection.description} onChange={(event) => updateSupport('description', event.target.value)} /></Field><Field label="Available hours"><input className={inputClass} value={form.supportSection.hours} onChange={(event) => updateSupport('hours', event.target.value)} /></Field><Field label="Small note"><input className={inputClass} value={form.supportSection.note} onChange={(event) => updateSupport('note', event.target.value)} /></Field><DriveFileUpload label="Support image (optional)" value={form.supportSection.imageUrl} onChange={(url) => updateSupport('imageUrl', url)} placeholder="Drive link বা upload" /></div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">{form.promoCards.map((card, index) => <div key={card.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"><div className="mb-3 flex items-center gap-2"><span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{card.key}</span><span className="text-xs font-black">Promo card {index + 1}</span></div><div className="space-y-3"><Field label="Eyebrow"><input className={inputClass} value={card.eyebrow} onChange={(event) => updatePromo(index, 'eyebrow', event.target.value)} /></Field><Field label="Title"><input className={inputClass} value={card.title} onChange={(event) => updatePromo(index, 'title', event.target.value)} /></Field><Field label="Button text"><input className={inputClass} value={card.buttonLabel} onChange={(event) => updatePromo(index, 'buttonLabel', event.target.value)} /></Field><Field label="Button link"><input className={inputClass} value={card.buttonUrl} onChange={(event) => updatePromo(index, 'buttonUrl', event.target.value)} placeholder="/free-classes বা https://..." /></Field></div></div>)}</div>
        </Section>

        <Card className="flex flex-col gap-4 border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={form.isPublished} onChange={(event) => update('isPublished', event.target.checked)} className="mt-1 h-4 w-4 accent-blue-600" /><span><span className="block text-sm font-black">Publicly visible</span><span className="mt-1 block text-xs text-slate-500">Unchecked রাখলে course draft হিসেবে থাকবে।</span></span></label><div className="flex gap-2"><Link href="/admin/courses"><Button type="button" variant="secondary">Cancel</Button></Link><Button type="submit" isLoading={submitting}><Save className="mr-1 h-4 w-4" /> {mode === 'create' ? 'Create' : 'Save changes'}</Button></div></Card>
      </form>
    </div>
  </div>;
}
