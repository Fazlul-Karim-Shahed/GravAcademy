'use client';

import { use } from 'react';
import CourseAdminForm from '@/components/course/CourseAdminForm';

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <main className="ga-page min-h-screen overflow-x-clip"><CourseAdminForm mode="edit" courseId={resolvedParams.id} /></main>;
}
