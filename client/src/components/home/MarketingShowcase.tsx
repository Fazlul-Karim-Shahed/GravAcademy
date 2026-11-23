'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Award, ArrowRight, MessageCircle, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDriveImageUrl } from '@/lib/drive';

export interface ShowcaseItem {
  _id: string;
  type: 'achiever' | 'testimonial';
  name: string;
  imageUrl?: string;
  title?: string;
  institution?: string;
  achievement?: string;
  quote?: string;
  relation?: 'student' | 'guardian' | 'alumni';
  rating?: number;
}

const roleLabel: Record<string, string> = { student: 'শিক্ষার্থী', guardian: 'অভিভাবক', alumni: 'প্রাক্তন শিক্ষার্থী' };

function Portrait({ item, className = '' }: { item: ShowcaseItem; className?: string }) {
  const url = formatDriveImageUrl(item.imageUrl);
  return url ? <img src={url} alt={item.name} className={`object-cover ${className}`} /> : <div className={`grid place-items-center bg-gradient-to-br from-orange-100 to-amber-50 text-orange-600 font-black ${className}`}>{item.name.slice(0, 1)}</div>;
}

export function AchieverStrip() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  useEffect(() => { api.get('/showcase', { params: { type: 'achiever', limit: 10 } }).then((r) => r.data?.success && setItems(r.data.data)).catch(() => undefined); }, []);
  if (!items.length) return null;
  const loop = [...items, ...items];
  return <section className="relative overflow-hidden bg-[#fffaf4] py-18 dark:bg-[#0f1014] sm:py-24">
    <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-500/10" />
    <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-amber-100/80 blur-3xl dark:bg-amber-500/10" />
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">কৃতি শিক্ষার্থীদের <span className="text-orange-600 dark:text-orange-400">সাফল্য</span></h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">নিষ্ঠা ও পরিশ্রমের এই গল্পগুলো তোমার স্বপ্ন পূরণের পথকে আরও সাহসী করে তুলুক।</p>
      </div>
    </div>
    <div className="relative before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-12 before:bg-gradient-to-r before:from-[#fffaf4] before:to-transparent after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-12 after:bg-gradient-to-l after:from-[#fffaf4] after:to-transparent dark:before:from-[#0f1014] dark:after:from-[#0f1014]">
      <div className="group flex w-max gap-4 py-2 hover:[animation-play-state:paused] motion-reduce:animate-none animate-[showcase-scroll_42s_linear_infinite]">
        {loop.map((item, index) => <article key={`${item._id}-${index}`} className="group/card flex w-[268px] shrink-0 items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 shadow-[0_8px_24px_rgba(120,53,15,0.07)] transition duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_16px_30px_rgba(234,88,12,0.13)] dark:border-[#2a2d34] dark:bg-[#181a20] dark:hover:border-orange-700 sm:w-[286px]">
          <div className="relative shrink-0"><div className="rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 p-1 dark:from-orange-950/60 dark:to-amber-950/30"><Portrait item={item} className="h-14 w-14 rounded-[13px]" /></div><span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-orange-600 text-[9px] font-black text-white shadow-sm">{(index % items.length) + 1}</span></div>
          <div className="min-w-0"><h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{item.name}</h3><p className="mt-1 line-clamp-2 text-xs font-bold leading-relaxed text-orange-600 dark:text-orange-400">{item.achievement}</p>{(item.title || item.institution) && <p className="mt-1.5 line-clamp-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.title || item.institution}</p>}</div>
        </article>)}
      </div>
    </div>
    <div className="relative mx-auto mt-10 flex justify-center px-4"><Link href="/achievers" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-600/25 transition hover:-translate-y-0.5 hover:from-orange-700 hover:to-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0f1014]">সকল কৃতি শিক্ষার্থী দেখুন <ArrowRight className="h-4 w-4" /></Link></div>
  </section>;
}

export function TestimonialSection() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  useEffect(() => { api.get('/showcase', { params: { type: 'testimonial', limit: 6 } }).then((r) => r.data?.success && setItems(r.data.data)).catch(() => undefined); }, []);
  if (!items.length) return null;
  return <section className="relative overflow-hidden bg-slate-50 py-20 dark:bg-[#090a0d] sm:py-28">
    <div className="absolute left-1/2 top-12 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-orange-200/35 blur-3xl dark:bg-orange-500/10" />
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mx-auto mb-12 max-w-2xl text-center"><h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">বিশ্বাসের গল্প, <span className="text-orange-600 dark:text-orange-400">সাফল্যের পথ</span></h2><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">শিক্ষার্থী ও অভিভাবকদের অভিজ্ঞতাই আমাদের এগিয়ে চলার সবচেয়ে বড় প্রেরণা।</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item._id} className="group relative flex min-h-[260px] flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl dark:border-[#262b34] dark:bg-[#111318]"><MessageCircle className="absolute right-5 top-5 h-9 w-9 text-orange-100 dark:text-orange-500/15" /><div className="mb-4 flex gap-0.5 text-amber-400">{Array.from({ length: item.rating || 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div><p className="relative flex-1 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">“{item.quote}”</p><div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"><Portrait item={item} className="h-11 w-11 rounded-full" /><div><h3 className="text-sm font-black text-slate-900 dark:text-white">{item.name}</h3><p className="text-[11px] font-bold text-orange-600 dark:text-orange-400">{roleLabel[item.relation || 'student']}{item.title ? ` · ${item.title}` : ''}</p></div></div></article>)}</div>
    </div>
  </section>;
}

export function AchieverDirectory() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  useEffect(() => { api.get('/showcase', { params: { type: 'achiever', limit: 50 } }).then((r) => r.data?.success && setItems(r.data.data)).catch(() => undefined); }, []);
  return <div className="ga-page ga-public-page min-h-screen bg-slate-50 py-12 text-slate-900 dark:bg-[#090a0d] dark:text-white sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-12 text-center"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"><Award className="h-3.5 w-3.5" /> GRAV ACADEMY PRIDE</div><h1 className="text-3xl font-black sm:text-5xl">আমাদের কৃতি শিক্ষার্থীরা</h1><p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">পরিশ্রম, সঠিক দিকনির্দেশনা এবং স্বপ্নকে বাস্তবে রূপ দেওয়ার অনুপ্রেরণাময় গল্প।</p></div>{items.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((item, index) => <article key={item._id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl dark:border-[#262b34] dark:bg-[#111318]"><div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"><Portrait item={item} className="h-full w-full transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-slate-950/85 text-xs font-black text-white">{index + 1}</span></div><div className="px-2 pb-2 pt-4"><h2 className="text-lg font-black">{item.name}</h2><p className="mt-1 text-sm font-bold text-orange-600 dark:text-orange-400">{item.achievement}</p>{(item.title || item.institution) && <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">{[item.title, item.institution].filter(Boolean).join(' · ')}</p>}</div></article>)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 py-20 text-center text-sm font-semibold text-slate-500 dark:border-slate-700">কৃতি শিক্ষার্থীদের তালিকা শিগগিরই যুক্ত হবে।</div>}</div></div>;
}
