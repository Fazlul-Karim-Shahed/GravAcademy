import type { Metadata } from 'next';
import Script from 'next/script';
import { cleanText, pageMetadata, publicApi, SITE_URL } from '@/lib/seo';

type SyllabusItem = { title?: string; details?: string; contentLines?: string[]; demoTitle?: string; demoUrl?: string };
type Teacher = { name?: string; teacherDetails?: { institution?: string; department?: string; experience?: string; specialistSubjects?: string[]; badge?: string } };
type Course = {
  _id?: string; title?: string; description?: string; slug?: string; thumbnailUrl?: string; gradeLevel?: string; subject?: string;
  courseFee?: number; regularPrice?: number; discountPrice?: number; duration?: string; durationMonths?: number; targetAudience?: string;
  accessLabel?: string; studentAccessMode?: string; studentAccessMonths?: number; instructors?: Teacher[]; curriculumHighlights?: string[];
  features?: string[]; syllabus?: SyllabusItem[]; routine?: { title?: string; bannerText?: string; programLabel?: string; routineUrl?: string; prospectusUrl?: string };
  supportSection?: { title?: string; description?: string; hours?: string; phone?: string; note?: string }; promoCards?: Array<{ eyebrow?: string; title?: string; buttonLabel?: string; buttonUrl?: string }>;
};

const detailText = (item: SyllabusItem) => item.contentLines?.filter(Boolean).join(' ') || item.details || '';
const displayFeatures = (course: Course) => (course.features?.length ? course.features : course.curriculumHighlights || []).map((item) => item.replace(/^icon:[^|]+\|/, '')).filter(Boolean);

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
  if (!course?.title) return <>{children}</>;

  const path = `/courses/${course.slug || id}`;
  const canonicalUrl = `${SITE_URL}${path}`;
  const price = course.discountPrice || course.regularPrice || course.courseFee;
  const courseJsonLd = {
    '@context': 'https://schema.org', '@type': 'Course', name: course.title,
    description: cleanText(course.description, course.title), url: canonicalUrl, image: course.thumbnailUrl || undefined,
    provider: { '@type': 'EducationalOrganization', name: 'Grav Academy', url: SITE_URL }, educationalLevel: course.gradeLevel, about: course.subject,
    teaches: course.syllabus?.map((item) => `${item.title || ''}: ${detailText(item)}`).filter(Boolean),
    offers: price !== undefined ? { '@type': 'Offer', price, priceCurrency: 'BDT', url: canonicalUrl, availability: 'https://schema.org/InStock' } : undefined,
  };

  return <>
    {children}
    <Script id="course-structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
    <article className="sr-only" aria-label={`${course.title} কোর্সের সম্পূর্ণ তথ্য`}>
      <header>
        <h1>{course.title}</h1><p>{course.description}</p><p>শ্রেণি: {course.gradeLevel || 'নির্ধারিত নয়'}</p>
        {course.subject ? <p>বিষয়: {course.subject}</p> : null}{course.targetAudience ? <p>যাদের জন্য: {course.targetAudience}</p> : null}
        {price !== undefined ? <p>কোর্স ফি: {price} টাকা</p> : <p>কোর্স ফি: ফ্রি</p>}
        {course.regularPrice && course.discountPrice && course.regularPrice > course.discountPrice ? <p>নিয়মিত মূল্য: {course.regularPrice} টাকা</p> : null}
        {course.duration ? <p>সময়কাল: {course.duration}</p> : null}{course.durationMonths ? <p>সময়সীমা: {course.durationMonths} মাস</p> : null}
        {course.accessLabel ? <p>অ্যাক্সেস: {course.accessLabel}</p> : null}
        {course.studentAccessMode ? <p>অ্যাক্সেসের ধরন: {course.studentAccessMode === 'lifetime' ? 'আজীবন' : course.studentAccessMonths ? `ভর্তির পর ${course.studentAccessMonths} মাস` : 'ব্যাচ অনুযায়ী'}</p> : null}
      </header>
      {course.instructors?.length ? <section><h2>কোর্সের শিক্ষকবৃন্দ</h2><ul>{course.instructors.map((teacher, index) => <li key={`${teacher.name}-${index}`}><strong>{teacher.name}</strong>{teacher.teacherDetails?.badge ? ` — ${teacher.teacherDetails.badge}` : ''}{teacher.teacherDetails?.institution ? `, প্রতিষ্ঠান: ${teacher.teacherDetails.institution}` : ''}{teacher.teacherDetails?.department ? `, বিভাগ: ${teacher.teacherDetails.department}` : ''}{teacher.teacherDetails?.experience ? `, অভিজ্ঞতা: ${teacher.teacherDetails.experience}` : ''}{teacher.teacherDetails?.specialistSubjects?.length ? `, বিশেষ বিষয়: ${teacher.teacherDetails.specialistSubjects.join(', ')}` : ''}</li>)}</ul></section> : null}
      {displayFeatures(course).length ? <section><h2>কোর্সে যা থাকছে</h2><ul>{displayFeatures(course).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section> : null}
      {course.syllabus?.length ? <section><h2>সম্পূর্ণ সিলেবাস</h2>{course.syllabus.map((item, index) => <section key={`${item.title}-${index}`}><h3>{item.title || `বিষয় ${index + 1}`}</h3>{detailText(item) ? <p>{detailText(item)}</p> : null}{item.demoTitle ? <p>{item.demoUrl ? <a href={item.demoUrl}>{item.demoTitle}</a> : item.demoTitle}</p> : null}</section>)}</section> : null}
      {course.routine ? <section><h2>{course.routine.title || 'ক্লাস রুটিন ও প্রসপেক্টাস'}</h2>{course.routine.bannerText ? <p>{course.routine.bannerText}</p> : null}{course.routine.programLabel ? <p>{course.routine.programLabel}</p> : null}{course.routine.routineUrl ? <a href={course.routine.routineUrl}>ক্লাস রুটিন দেখুন</a> : null}{course.routine.prospectusUrl ? <a href={course.routine.prospectusUrl}>প্রসপেক্টাস দেখুন</a> : null}</section> : null}
      {course.supportSection ? <section><h2>{course.supportSection.title || 'সাপোর্ট'}</h2>{course.supportSection.description ? <p>{course.supportSection.description}</p> : null}{course.supportSection.hours ? <p>সময়: {course.supportSection.hours}</p> : null}{course.supportSection.phone ? <p>ফোন: {course.supportSection.phone}</p> : null}{course.supportSection.note ? <p>{course.supportSection.note}</p> : null}</section> : null}
      {course.promoCards?.length ? <section><h2>আরও জানুন</h2><ul>{course.promoCards.map((card, index) => <li key={`${card.title}-${index}`}>{card.eyebrow ? <span>{card.eyebrow}: </span> : null}{card.buttonUrl ? <a href={card.buttonUrl}>{card.title || card.buttonLabel}</a> : <span>{card.title || card.buttonLabel}</span>}</li>)}</ul></section> : null}
    </article>
  </>;
}
