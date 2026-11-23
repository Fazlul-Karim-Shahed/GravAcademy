import type { Metadata } from 'next';
import { cleanText, pageMetadata, publicApi } from '@/lib/seo';

type Job = { title?: string; slug?: string; shortDescription?: string; organizationName?: string; circularImageUrl?: string; postName?: string; educationalQualification?: string; applicationDeadline?: string; fullDescriptionHtml?: string };
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await publicApi<Job>(`/jobs/${encodeURIComponent(slug)}`);
  if (!job?.title) return pageMetadata({ title: 'জব সার্কুলার', description: 'চাকরির বিজ্ঞপ্তি এবং আবেদনের তথ্য দেখুন।', path: `/jobs/${slug}` });
  return pageMetadata({ title: job.title, description: cleanText(job.shortDescription, `${job.organizationName || ''} — ${job.postName || 'চাকরির বিজ্ঞপ্তি'}`), path: `/jobs/${job.slug || slug}`, image: job.circularImageUrl });
}
export default async function JobDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await publicApi<Job>(`/jobs/${encodeURIComponent(slug)}`);
  return <>{children}{job?.title && <article className="sr-only" aria-label={`${job.title} চাকরির বিজ্ঞপ্তি`}><h1>{job.title}</h1><p>{job.shortDescription}</p><p>প্রতিষ্ঠান: {job.organizationName}</p><p>পদ: {job.postName}</p>{job.educationalQualification ? <p>শিক্ষাগত যোগ্যতা: {job.educationalQualification}</p> : null}{job.applicationDeadline ? <p>আবেদনের শেষ তারিখ: {job.applicationDeadline}</p> : null}{job.fullDescriptionHtml ? <p>{cleanText(job.fullDescriptionHtml, '')}</p> : null}</article>}</>;
}
