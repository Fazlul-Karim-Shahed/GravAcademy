import type { Metadata } from 'next';
import { cleanText, pageMetadata, publicApi } from '@/lib/seo';

type ClassResponse = { academicClass?: { name?: string; slug?: string; description?: string; subtitle?: string; heroBannerUrl?: string } };
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await publicApi<ClassResponse>(`/classes/${encodeURIComponent(slug)}`);
  const academicClass = data?.academicClass;
  if (!academicClass?.name) return pageMetadata({ title: 'শ্রেণিভিত্তিক পড়াশোনা', description: 'গ্র্যাভ একাডেমির শ্রেণিভিত্তিক কোর্স ও সহায়তা দেখুন।', path: `/classes/${slug}` });
  return pageMetadata({ title: `${academicClass.name} — কোর্স ও প্রস্তুতি`, description: cleanText(academicClass.description || academicClass.subtitle), path: `/classes/${academicClass.slug || slug}`, image: academicClass.heroBannerUrl });
}
export default function ClassDetailLayout({ children }: { children: React.ReactNode }) { return children; }
