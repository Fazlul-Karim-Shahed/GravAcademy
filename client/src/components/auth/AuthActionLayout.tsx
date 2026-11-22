import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SiteLogo } from '@/components/common/SiteLogo';

export function AuthActionLayout({ children, backHref = '/login', backLabel = 'Login' }: { children: React.ReactNode; backHref?: string; backLabel?: string }) {
  return <main className="ga-page ga-auth-page min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-10">
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-[#262b34] dark:bg-[#111318] lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="relative hidden min-h-[34rem] overflow-hidden bg-[#111827] p-9 text-white lg:flex lg:flex-col lg:justify-between">
        <SiteLogo size="lg" showText textClassName="text-white" taglineClassName="text-slate-400" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[54px] border-orange-500/15" />
        <div className="pointer-events-none absolute -right-16 top-1/3 h-52 w-52 rounded-full border-[38px] border-blue-500/10" />
        <div className="relative h-px w-24 bg-orange-500" />
      </aside>
      <div className="flex min-w-0 flex-col justify-center p-5 sm:p-9 lg:p-12">
        <Link href={backHref} className="mb-7 inline-flex w-fit items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-orange-600 dark:hover:text-orange-400"><ArrowLeft className="h-4 w-4" />{backLabel}</Link>
        {children}
      </div>
    </div>
  </main>;
}
