import type { Metadata } from 'next';
import { cleanText, pageMetadata, publicApi } from '@/lib/seo';

type Job = { title?: string; slug?: string; shortDescription?: string; organizationName?: string; circularImageUrl?: string; postName?: string };
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await publicApi<Job>(`/jobs/${encodeURIComponent(slug)}`);
  if (!job?.title) return pageMetadata({ title: 'জব সার্কুলার', description: 'চাকরির বিজ্ঞপ্তি এবং আবেদনের তথ্য দেখুন।', path: `/jobs/${slug}` });
  return pageMetadata({ title: job.title, description: cleanText(job.shortDescription, `${job.organizationName || ''} — ${job.postName || 'চাকরির বিজ্ঞপ্তি'}`), path: `/jobs/${job.slug || slug}`, image: job.circularImageUrl });
}
export default function JobDetailLayout({ children }: { children: React.ReactNode }) { return children; }
