'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, PERMISSIONS, type PermissionKey } from '@/lib/permissions';
import { ArrowRight, BriefcaseBusiness, CircleDollarSign, FileCheck2, Inbox, Video, CalendarCheck, ShieldCheck, BookOpen, Layers } from 'lucide-react';

interface EmployeeCard {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  permissions: Array<{ key: PermissionKey; label: string }>;
  routePermissions: PermissionKey[];
}

const employeeCards: EmployeeCard[] = [
  {
    title: 'কোর্স ম্যানেজমেন্ট', description: 'কোর্সের তালিকা দেখুন।', href: '/employee/courses', icon: BookOpen,
    iconClass: 'bg-orange-500/10 text-orange-600', routePermissions: [PERMISSIONS.COURSES_VIEW, PERMISSIONS.COURSES_CREATE, PERMISSIONS.COURSES_UPDATE, PERMISSIONS.COURSES_DELETE, PERMISSIONS.CLASSES_MANAGE],
    permissions: [{ key: PERMISSIONS.COURSES_VIEW, label: 'কোর্স দেখুন' }, { key: PERMISSIONS.COURSES_CREATE, label: 'তৈরি' }, { key: PERMISSIONS.COURSES_UPDATE, label: 'এডিট' }, { key: PERMISSIONS.COURSES_DELETE, label: 'ডিলিট' }, { key: PERMISSIONS.CLASSES_MANAGE, label: 'ক্লাস ম্যানেজ' }],
  },
  {
    title: 'ব্যাচ ম্যানেজমেন্ট', description: 'ব্যাচ, ক্লাসরুম ও কারিকুলাম পরিচালনা করুন।', href: '/employee/batches', icon: Layers,
    iconClass: 'bg-blue-500/10 text-blue-600', routePermissions: [PERMISSIONS.BATCHES_VIEW, PERMISSIONS.BATCHES_MANAGE, PERMISSIONS.BATCHES_DELETE, PERMISSIONS.BATCHES_DUPLICATE, PERMISSIONS.EXAMS_MANAGE, PERMISSIONS.LESSONS_MANAGE],
    permissions: [
      { key: PERMISSIONS.BATCHES_VIEW, label: 'শুধুমাত্র দেখা' },
      { key: PERMISSIONS.BATCHES_MANAGE, label: 'তৈরি ও এডিট' },
      { key: PERMISSIONS.BATCHES_DELETE, label: 'ডিলিট' },
      { key: PERMISSIONS.BATCHES_DUPLICATE, label: 'ডুপ্লিকেট' },
      { key: PERMISSIONS.EXAMS_MANAGE, label: 'ক্লাসরুম ম্যানেজ' },
      { key: PERMISSIONS.LESSONS_MANAGE, label: 'কারিকুলাম ম্যানেজ' },
    ],
  },
  {
    title: 'শিক্ষক হাজিরা', description: 'শিক্ষক হাজিরা ও ইতিহাস দেখুন।', href: '/employee/attendance', icon: CalendarCheck,
    iconClass: 'bg-orange-500/10 text-orange-600', routePermissions: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE],
    permissions: [{ key: PERMISSIONS.ATTENDANCE_VIEW, label: 'হাজিরা দেখুন' }, { key: PERMISSIONS.ATTENDANCE_MANAGE, label: 'হাজিরা ম্যানেজ' }],
  },
  {
    title: 'অডিট লগ', description: 'কার্যক্রমের ইতিহাস দেখুন।', href: '/employee/audit-logs', icon: ShieldCheck,
    iconClass: 'bg-slate-500/10 text-slate-600', routePermissions: [PERMISSIONS.AUDIT_LOGS_VIEW],
    permissions: [{ key: PERMISSIONS.AUDIT_LOGS_VIEW, label: 'অডিট লগ দেখুন' }],
  },
  {
    title: 'জব সার্কুলার', description: 'অনুমোদিত নিয়োগ বিজ্ঞপ্তি দেখুন ও পরিচালনা করুন।', href: '/employee/jobs', icon: BriefcaseBusiness,
    iconClass: 'bg-blue-500/10 text-blue-600', routePermissions: [PERMISSIONS.JOBS_VIEW, PERMISSIONS.JOBS_MANAGE],
    permissions: [{ key: PERMISSIONS.JOBS_VIEW, label: 'বিজ্ঞপ্তি দেখুন' }, { key: PERMISSIONS.JOBS_MANAGE, label: 'বিজ্ঞপ্তি ম্যানেজ' }],
  },
  {
    title: 'ইউজার ম্যানেজমেন্ট', description: 'অনুমোদিত ইউজার ও পারমিশন পরিচালনা করুন।', href: '/employee/users', icon: BriefcaseBusiness,
    iconClass: 'bg-violet-500/10 text-violet-600', routePermissions: [PERMISSIONS.USERS_MANAGE, PERMISSIONS.PERMISSIONS_MANAGE],
    permissions: [{ key: PERMISSIONS.USERS_MANAGE, label: 'ইউজার ম্যানেজ' }, { key: PERMISSIONS.PERMISSIONS_MANAGE, label: 'পারমিশন ম্যানেজ' }],
  },
  {
    title: 'অন্যান্য সেটিংস', description: 'সাইট, হোমপেজ ও Drive Cleanup পরিচালনা করুন।', href: '/employee/settings', icon: ShieldCheck,
    iconClass: 'bg-slate-500/10 text-slate-600', routePermissions: [PERMISSIONS.SETTINGS_MANAGE],
    permissions: [{ key: PERMISSIONS.SETTINGS_MANAGE, label: 'সেটিংস ম্যানেজ' }],
  },
  {
    title: 'ভর্তি Requests', description: 'শিক্ষার্থীদের ভর্তি আবেদন দেখুন ও অনুমোদন করুন।', href: '/employee/admission-requests', icon: Inbox,
    iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', routePermissions: [PERMISSIONS.ADMISSIONS_VIEW, PERMISSIONS.ADMISSIONS_CREATE],
    permissions: [
      { key: PERMISSIONS.ADMISSIONS_VIEW, label: 'Requests দেখুন' }, { key: PERMISSIONS.ADMISSIONS_CREATE, label: 'Approve / Reject' },
    ],
  },
  {
    title: 'এডমিশন', description: 'শিক্ষার্থী ভর্তি ও সাম্প্রতিক ভর্তি পরিচালনা করুন।', href: '/employee/admissions', icon: FileCheck2,
    iconClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', routePermissions: [PERMISSIONS.ADMISSIONS_VIEW, PERMISSIONS.ADMISSIONS_CREATE],
    permissions: [
      { key: PERMISSIONS.ADMISSIONS_CREATE, label: 'শিক্ষার্থী ভর্তি' }, { key: PERMISSIONS.ADMISSIONS_VIEW, label: 'সাম্প্রতিক ভর্তি' },
      { key: PERMISSIONS.ADMISSIONS_SHIFT, label: 'ব্যাচ পরিবর্তন' }, { key: PERMISSIONS.ADMISSIONS_REMOVE, label: 'ভর্তি বাতিল' },
    ],
  },
  {
    title: 'ফাইন্যান্স ম্যানেজমেন্ট', description: 'অনুমোদিত পেমেন্ট ও খরচের কাজ এক জায়গা থেকে করুন।', href: '/employee/finance', icon: CircleDollarSign,
    iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', routePermissions: [PERMISSIONS.FINANCE_VIEW],
    permissions: [
      { key: PERMISSIONS.FINANCE_VIEW, label: 'ফাইন্যান্স রিপোর্ট' }, { key: PERMISSIONS.FINANCE_COLLECT, label: 'পেমেন্ট গ্রহণ' },
      { key: PERMISSIONS.FINANCE_REFUND, label: 'রিফান্ড' }, { key: PERMISSIONS.FINANCE_MANUAL_PAID, label: 'পেইড স্ট্যাটাস' },
      { key: PERMISSIONS.FINANCE_DELETE, label: 'পেমেন্ট ডিলিট' }, { key: PERMISSIONS.FINANCE_EXPENSE_MANAGE, label: 'কোম্পানি খরচ' },
    ],
  },
  {
    title: 'ফ্রি ক্লাস ও সেমিনার', description: 'ফ্রি ক্লাস, সেমিনার ও সেগুলোর তথ্য পরিচালনা করুন।', href: '/employee/free-classes', icon: Video,
    iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', routePermissions: [PERMISSIONS.LIVE_CLASSES_MANAGE],
    permissions: [{ key: PERMISSIONS.LIVE_CLASSES_MANAGE, label: 'ফ্রি ক্লাস ম্যানেজ' }],
  },
];

export default function EmployeePanelPage() {
  const { user, loading } = useAuth();
  const allowedCards = employeeCards.filter((card) => card.routePermissions.some((permission) => hasPermission(user, permission)));

  return (
    <main className="ga-page ga-dashboard-page mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="ga-card mb-7 overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-700 dark:text-orange-300"><BriefcaseBusiness className="h-3.5 w-3.5" /> কর্মী ড্যাশবোর্ড</span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">আপনার অনুমোদিত কাজ</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">অ্যাডমিন যে কাজগুলো অনুমতি দিয়েছেন, শুধু সেগুলোই এখানে দেখানো হচ্ছে।</p>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{loading ? 'অনুমতি যাচাই হচ্ছে…' : `${allowedCards.length}টি সেকশন উপলব্ধ`}</p>
        </div>
      </section>

      {!loading && allowedCards.length === 0 ? (
        <section className="ga-card px-6 py-16 text-center">
          <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">এখনও কোনো অপারেশনাল অনুমতি নেই</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">প্রয়োজনীয় কাজের অনুমতি দিতে একজন অ্যাডমিনকে অনুরোধ করুন।</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {allowedCards.map((card) => {
            const Icon = card.icon;
            const grantedActions = card.permissions.filter(({ key }) => hasPermission(user, key));
            return (
              <Link key={card.href} href={card.href} className="group ga-card flex min-h-[244px] flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg dark:hover:border-orange-500/40">
                <div className="flex items-start justify-between gap-4"><span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconClass}`}><Icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-600 dark:group-hover:text-orange-400" /></div>
                <h2 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">{card.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{card.description}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">{grantedActions.map(({ key, label }) => <span key={key} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{label}</span>)}</div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
