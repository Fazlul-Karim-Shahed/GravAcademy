import { BookOpenCheck, CheckCircle2 } from 'lucide-react';
import { SiteLogo } from '@/components/common/SiteLogo';

export function AuthBrandPanel({ mode }: { mode: 'login' | 'register' }) {
  const points = mode === 'login'
    ? ['ক্লাস ও ম্যাটেরিয়াল', 'পরীক্ষা ও অগ্রগতি']
    : ['একটি একাউন্টে সব কোর্স', 'নিরাপদ শিক্ষার্থী পোর্টাল'];

  return (
    <aside className="relative hidden min-h-[38rem] overflow-hidden rounded-2xl border border-slate-800 bg-[#111318] text-white lg:flex lg:flex-col">
      <div className="absolute inset-x-0 top-0 h-1 bg-orange-500" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full border-[52px] border-orange-500/10" />
      <div className="pointer-events-none absolute -bottom-10 -right-2 h-44 w-44 rounded-full border border-white/10" />

      <div className="relative flex items-center justify-between border-b border-white/10 px-8 py-7">
        <SiteLogo size="lg" showText textClassName="text-white" taglineClassName="text-slate-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-orange-500 ring-4 ring-orange-500/15" />
      </div>

      <div className="relative flex flex-1 flex-col justify-center px-8 py-12 xl:px-10">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-orange-400">
          <BookOpenCheck className="h-7 w-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Your Academic Care</p>
        <h2 className="mt-4 max-w-sm text-3xl font-black leading-[1.28] tracking-tight xl:text-4xl">
          শেখা, অনুশীলন ও অগ্রগতি—এক জায়গায়
        </h2>
        <div className="mt-9 space-y-3 border-t border-white/10 pt-6">
          {points.map((point) => (
            <div key={point} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-400" />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative px-8 pb-8 text-xs font-medium text-slate-500">GRAV ACADEMY</div>
    </aside>
  );
}
