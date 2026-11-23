import type { Metadata } from 'next';
import { cleanText, pageMetadata, publicApi } from '@/lib/seo';

type Course = { _id?: string; title?: string; description?: string; slug?: string; thumbnailUrl?: string; gradeLevel?: string; subject?: string; courseFee?: number; duration?: string; instructors?: Array<{ name?: string }>; curriculumHighlights?: string[]; syllabus?: Array<{ title?: string; details?: string; contentLines?: string[] }> };
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course = await publicApi<Course>(`/courses/${encodeURIComponent(id)}`);
  if (!course?.title) return pageMetadata({ title: 'কোর্সের বিস্তারিত', description: 'গ্র্যাভ একাডেমির কোর্সের বিস্তারিত তথ্য দেখুন।', path: `/courses/${id}` });
  const description = cleanText(course.description, `${course.gradeLevel || ''} ${course.subject || ''} — গ্র্যাভ একাডেমির অনলাইন কোর্স।`);
  return pageMetadata({ title: course.title, description, path: `/courses/${course.slug || id}`, image: course.thumbnailUrl });
}
export default async function CourseLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await publicApi<Course>(`/courses/${encodeURIComponent(id)}`);
  return <>{children}{course?.title && <article className="sr-only" aria-label={`${course.title} কোর্সের বিস্তারিত`}><h1>{course.title}</h1><p>{course.description}</p><p>{course.gradeLevel} {course.subject ? `— ${course.subject}` : ''}</p>{course.courseFee ? <p>কোর্স ফি: {course.courseFee} টাকা</p> : null}{course.duration ? <p>সময়কাল: {course.duration}</p> : null}{course.instructors?.length ? <section><h2>শিক্ষকবৃন্দ</h2><ul>{course.instructors.map((teacher, index) => <li key={`${teacher.name}-${index}`}>{teacher.name}</li>)}</ul></section> : null}{course.curriculumHighlights?.length ? <section><h2>কোর্সের বৈশিষ্ট্য</h2><ul>{course.curriculumHighlights.map((item, index) => <li key={index}>{item.replace(/^icon:[^|]+\|/, '')}</li>)}</ul></section> : null}{course.syllabus?.length ? <section><h2>সিলেবাস</h2>{course.syllabus.map((item, index) => <div key={index}><h3>{item.title}</h3><p>{item.details || item.contentLines?.join(' ')}</p></div>)}</section> : null}</article>}</>;
}
