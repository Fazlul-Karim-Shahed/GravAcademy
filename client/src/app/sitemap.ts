import type { MetadataRoute } from 'next';
import { publicApi, SITE_URL } from '@/lib/seo';

type Course = { slug?: string; _id: string; updatedAt?: string };
type AcademicClass = { slug?: string; name?: string; updatedAt?: string };
type Job = { slug: string; updatedAt?: string };
const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, classes, jobs] = await Promise.all([
    publicApi<Course[]>('/courses?isPublished=true'),
    publicApi<AcademicClass[]>('/classes'),
    publicApi<Job[]>('/jobs?limit=50'),
  ]);
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    ['', 1], ['/courses', 0.9], ['/classes', 0.9], ['/free-classes', 0.7], ['/achievers', 0.7], ['/jobs', 0.6], ['/teacher', 0.6],
  ].map(([path, priority]) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency: 'weekly', priority: Number(priority) }));
  return [
    ...staticPages,
    ...(courses || []).map((course) => ({ url: `${SITE_URL}/courses/${course.slug || course._id}`, lastModified: course.updatedAt ? new Date(course.updatedAt) : now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...(classes || []).map((item) => ({ url: `${SITE_URL}/classes/${item.slug || slugify(item.name)}`, lastModified: item.updatedAt ? new Date(item.updatedAt) : now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...(jobs || []).map((job) => ({ url: `${SITE_URL}/jobs/${job.slug}`, lastModified: job.updatedAt ? new Date(job.updatedAt) : now, changeFrequency: 'daily' as const, priority: 0.6 })),
  ];
}
