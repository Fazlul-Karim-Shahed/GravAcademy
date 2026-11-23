import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'আমাদের কৃতি শিক্ষার্থীরা', description: 'গ্র্যাভ একাডেমির কৃতি শিক্ষার্থীদের অনুপ্রেরণাময় সাফল্যের গল্পগুলো দেখুন।', path: '/achievers' });
export default function AchieversLayout({ children }: { children: React.ReactNode }) { return children; }
