'use client';

import { Clock3, Rocket } from 'lucide-react';

export default function ComingSoonCard({ feature = 'এই ফিচার' }: { feature?: string }) {
  return (
    <div className="relative overflow-hidden w-full max-w-xl rounded-[2rem] border border-blue-200/70 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-2xl shadow-blue-900/10 p-8 sm:p-10 text-center">
      <div className="absolute -top-24 -right-20 w-56 h-56 rounded-full bg-blue-500/10 blur-2xl" />
      <div className="absolute -bottom-24 -left-20 w-56 h-56 rounded-full bg-violet-500/10 blur-2xl" />
      <div className="relative mx-auto mb-5 w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/25">
        <Clock3 className="w-9 h-9" />
        <span className="absolute -right-1 -top-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-lg">
          <Rocket className="w-4 h-4" />
        </span>
      </div>
      <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-[11px] font-extrabold uppercase tracking-wider">
        <Clock3 className="w-3 h-3" /> Coming Soon
      </span>
      <h1 className="relative mt-5 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{feature} খুব শীঘ্রই আসছে</h1>
      <p className="relative mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        আমরা আপনার জন্য এই অভিজ্ঞতাটি আরও সুন্দরভাবে প্রস্তুত করছি। Stay tuned—নতুন ফিচার প্রকাশ হলে সবার আগে জানতে পারবেন।
      </p>
    </div>
  );
}
