'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, PERMISSIONS, type PermissionKey } from '@/lib/permissions';
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  CircleDollarSign,
  FileCheck2,
  FileClock,
  Inbox,
  Layers,
  Settings2,
  UsersRound,
  Video,
} from 'lucide-react';

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
    title: 'অডিট লগ', description: 'গুরুত্বপূর্ণ কার্যক্রমের ইতিহাস দেখুন।', href: '/employee/audit-logs', icon: FileClock,
    iconClass: 'bg-slate-500/10 text-slate-600', routePermissions: [PERMISSIONS.AUDIT_LOGS_VIEW],
    permissions: [{ key: PERMISSIONS.AUDIT_LOGS_VIEW, label: 'অডিট লগ দেখুন' }],
  },
  {
    title: 'জব সার্কুলার', description: 'অনুমোদিত নিয়োগ বিজ্ঞপ্তি দেখুন ও পরিচালনা করুন।', href: '/employee/jobs', icon: BriefcaseBusiness,
    iconClass: 'bg-blue-500/10 text-blue-600', routePermissions: [PERMISSIONS.JOBS_VIEW, PERMISSIONS.JOBS_MANAGE],
    permissions: [{ key: PERMISSIONS.JOBS_VIEW, label: 'বিজ্ঞপ্তি দেখুন' }, { key: PERMISSIONS.JOBS_MANAGE, label: 'বিজ্ঞপ্তি ম্যানেজ' }],
  },
  {
    title: 'ইউজার ম্যানেজমেন্ট', description: 'অনুমোদিত ইউজার ও পারমিশন পরিচালনা করুন।', href: '/employee/users', icon: UsersRound,
    iconClass: 'bg-violet-500/10 text-violet-600', routePermissions: [PERMISSIONS.USERS_MANAGE, PERMISSIONS.PERMISSIONS_MANAGE],
    permissions: [{ key: PERMISSIONS.USERS_MANAGE, label: 'ইউজার ম্যানেজ' }, { key: PERMISSIONS.PERMISSIONS_MANAGE, label: 'পারমিশন ম্যানেজ' }],
  },
  {
    title: 'অন্যান্য সেটিংস', description: 'সাইট, হোমপেজ ও Drive Cleanup পরিচালনা করুন।', href: '/employee/settings', icon: Settings2,
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
    iconClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', routePermissions: [PERMISSIONS.ADMISSIONS_VIEW, PERMISSIONS.ADMISSIONS_CREATE, PERMISSIONS.ADMISSIONS_SHIFT, PERMISSIONS.ADMISSIONS_REMOVE],
    permissions: [
      { key: PERMISSIONS.ADMISSIONS_CREATE, label: 'শিক্ষার্থী ভর্তি' }, { key: PERMISSIONS.ADMISSIONS_VIEW, label: 'সাম্প্রতিক ভর্তি' },
      { key: PERMISSIONS.ADMISSIONS_SHIFT, label: 'ব্যাচ পরিবর্তন' }, { key: PERMISSIONS.ADMISSIONS_REMOVE, label: 'ভর্তি বাতিল' },
    ],
  },
  {
    title: 'ফাইন্যান্স ম্যানেজমেন্ট', description: 'অনুমোদিত পেমেন্ট ও খরচের কাজ এক জায়গা থেকে করুন।', href: '/employee/finance', icon: CircleDollarSign,
    iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', routePermissions: [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_COLLECT, PERMISSIONS.FINANCE_REFUND, PERMISSIONS.FINANCE_DELETE, PERMISSIONS.FINANCE_MANUAL_PAID, PERMISSIONS.FINANCE_EXPENSE_MANAGE],
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
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'ইমপ্লয়ি';

  return (
    <main className="ga-page ga-dashboard-page mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-8 border-b border-slate-200 pb-6 dark:border-[#262b34] sm:mb-10 sm:pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-500/10"><BriefcaseBusiness className="h-3.5 w-3.5" /></span>
              ইমপ্লয়ি ড্যাশবোর্ড
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              স্বাগতম, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              অ্যাডমিন আপনার জন্য যে সেকশনগুলো অনুমোদন করেছেন, সেগুলো এখান থেকে ব্যবহার করুন।
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-xs dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-300">
            <span className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
            {loading ? 'অ্যাক্সেস যাচাই হচ্ছে…' : `${allowedCards.length}টি সেকশন চালু আছে`}
          </div>
        </div>
      </header>

      {loading ? (
        <section aria-label="ইমপ্লয়ি সেকশন লোড হচ্ছে">
          <div className="mb-5 h-6 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="min-h-[218px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#262b34] dark:bg-[#111318] sm:p-6">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="mt-5 h-5 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-3 h-3 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-3/5 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </section>
      ) : allowedCards.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-[#111318]/60">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">এখনও কোনো সেকশন দেওয়া হয়নি</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">প্রয়োজনীয় সেকশনের অ্যাক্সেসের জন্য একজন অ্যাডমিনের সঙ্গে যোগাযোগ করুন।</p>
        </section>
      ) : (
        <section aria-labelledby="employee-sections-title">
          <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
            <div>
              <h2 id="employee-sections-title" className="text-lg font-extrabold text-slate-950 dark:text-white sm:text-xl">আপনার সেকশন</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">যে কাজটি করতে চান, সেই সেকশনটি খুলুন</p>
            </div>
            <span className="hidden text-xs font-semibold text-slate-400 sm:block">{allowedCards.length}টি সেকশন</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allowedCards.map((card) => {
              const Icon = card.icon;
              const grantedActions = card.permissions.filter(({ key }) => hasPermission(user, key));
              const hasPaymentAccess = [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_COLLECT, PERMISSIONS.FINANCE_REFUND, PERMISSIONS.FINANCE_DELETE, PERMISSIONS.FINANCE_MANUAL_PAID]
                .some((permission) => hasPermission(user, permission));
              const cardHref = card.href === '/employee/finance' && !hasPaymentAccess && hasPermission(user, PERMISSIONS.FINANCE_EXPENSE_MANAGE)
                ? '/employee/finance/company-expenses'
                : card.href;

              return (
                <Link
                  key={card.href}
                  href={cardHref}
                  className="group flex min-h-[218px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-[#262b34] dark:bg-[#111318] dark:hover:border-orange-500/40 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-600 dark:border-[#303640] dark:group-hover:border-orange-800 dark:group-hover:bg-orange-950/40 dark:group-hover:text-orange-400">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-base font-extrabold text-slate-950 transition-colors group-hover:text-orange-700 dark:text-white dark:group-hover:text-orange-400">{card.title}</h3>
                    <p className="mt-1.5 text-sm leading-5 text-slate-500 dark:text-slate-400">{card.description}</p>
                  </div>

                  <div className="mt-auto border-t border-slate-100 pt-4 dark:border-[#262b34]">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">আপনার অ্যাক্সেস</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      {grantedActions.map(({ key, label }) => (
                        <span key={key} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
