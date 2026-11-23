import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'শ্রেণিভিত্তিক পড়াশোনা', description: 'ষষ্ঠ থেকে দ্বাদশ শ্রেণি পর্যন্ত বিষয়ভিত্তিক কোর্স, লাইভ ক্লাস ও একাডেমিক সহায়তা।', path: '/classes' });
export default function ClassesLayout({ children }: { children: React.ReactNode }) { return children; }
