import type { Metadata } from 'next';
import { cleanText, pageMetadata, publicApi } from '@/lib/seo';

type ClassResponse = { academicClass?: { name?: string; slug?: string; description?: string; subtitle?: string; heroBannerUrl?: string; subjects?: string[]; curriculumHighlights?: string[] }; courses?: Array<{ _id: string; slug?: string; title?: string; description?: string }> };
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await publicApi<ClassResponse>(`/classes/${encodeURIComponent(slug)}`);
  const academicClass = data?.academicClass;
  if (!academicClass?.name) return pageMetadata({ title: 'শ্রেণিভিত্তিক পড়াশোনা', description: 'গ্র্যাভ একাডেমির শ্রেণিভিত্তিক কোর্স ও সহায়তা দেখুন।', path: `/classes/${slug}` });
  return pageMetadata({ title: `${academicClass.name} — কোর্স ও প্রস্তুতি`, description: cleanText(academicClass.description || academicClass.subtitle), path: `/classes/${academicClass.slug || slug}`, image: academicClass.heroBannerUrl });
}
export default async function ClassDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await publicApi<ClassResponse>(`/classes/${encodeURIComponent(slug)}`);
  const item = data?.academicClass;
  return <>{children}{item?.name && <article className="sr-only" aria-label={`${item.name} শ্রেণির কোর্সের বিস্তারিত`}><h1>{item.name}</h1><p>{item.description || item.subtitle}</p>{item.subjects?.length ? <p>বিষয়: {item.subjects.join(', ')}</p> : null}{item.curriculumHighlights?.length ? <ul>{item.curriculumHighlights.map((highlight, index) => <li key={index}>{highlight}</li>)}</ul> : null}{data?.courses?.map((course) => <article key={course._id}><h2><a href={`/courses/${course.slug || course._id}`}>{course.title}</a></h2><p>{course.description}</p></article>)}</article>}</>;
}
