import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'সকল কোর্স', description: 'ক্লাস ৬ থেকে ১২ পর্যন্ত লাইভ ক্লাস, পরীক্ষার প্রস্তুতি ও একাডেমিক কেয়ারের কোর্সসমূহ দেখুন।', path: '/courses' });
export default function CoursesLayout({ children }: { children: React.ReactNode }) { return children; }
