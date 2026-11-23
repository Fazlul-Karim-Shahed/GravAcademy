import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'ফ্রি ক্লাস ও সেমিনার', description: 'গ্র্যাভ একাডেমির ফ্রি লাইভ ক্লাস, সেমিনার এবং শেখার সুযোগগুলো দেখুন।', path: '/free-classes' });
export default function FreeClassesLayout({ children }: { children: React.ReactNode }) { return children; }
