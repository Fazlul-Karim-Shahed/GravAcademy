import type { Metadata } from 'next';
import { cleanText, pageMetadata, publicApi } from '@/lib/seo';

type Course = { title?: string; description?: string; slug?: string; thumbnailUrl?: string; gradeLevel?: string; subject?: string };
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course = await publicApi<Course>(`/courses/${encodeURIComponent(id)}`);
  if (!course?.title) return pageMetadata({ title: 'কোর্সের বিস্তারিত', description: 'গ্র্যাভ একাডেমির কোর্সের বিস্তারিত তথ্য দেখুন।', path: `/courses/${id}` });
  const description = cleanText(course.description, `${course.gradeLevel || ''} ${course.subject || ''} — গ্র্যাভ একাডেমির অনলাইন কোর্স।`);
  return pageMetadata({ title: course.title, description, path: `/courses/${course.slug || id}`, image: course.thumbnailUrl });
}
export default function CourseLayout({ children }: { children: React.ReactNode }) { return children; }
