import type { Metadata } from 'next';
import { pageMetadata, publicApi } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'সকল কোর্স', description: 'ক্লাস ৬ থেকে ১২ পর্যন্ত লাইভ ক্লাস, পরীক্ষার প্রস্তুতি ও একাডেমিক কেয়ারের কোর্সসমূহ দেখুন।', path: '/courses' });
type Course = { _id: string; slug?: string; title: string; description?: string; gradeLevel?: string; subject?: string; courseFee?: number };
export default async function CoursesLayout({ children }: { children: React.ReactNode }) {
  const courses = await publicApi<Course[]>('/courses?isPublished=true');
  return <>{children}<section className="sr-only" aria-label="প্রকাশিত কোর্সসমূহ"><h1>গ্র্যাভ একাডেমির সকল কোর্স</h1>{(courses || []).map((course) => <article key={course._id}><h2><a href={`/courses/${course.slug || course._id}`}>{course.title}</a></h2><p>{course.description}</p><p>{course.gradeLevel} {course.subject ? `— ${course.subject}` : ''} {course.courseFee ? `— কোর্স ফি ${course.courseFee} টাকা` : ''}</p></article>)}</section></>;
}
