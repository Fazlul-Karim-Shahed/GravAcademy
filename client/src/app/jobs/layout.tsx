import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'জব সার্কুলার', description: 'সাম্প্রতিক সরকারি ও বেসরকারি চাকরির বিজ্ঞপ্তি, যোগ্যতা এবং আবেদনের তথ্য দেখুন।', path: '/jobs' });
export default function JobsLayout({ children }: { children: React.ReactNode }) { return children; }
