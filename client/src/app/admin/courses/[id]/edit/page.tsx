'use client';

import { use } from 'react';
import CourseAdminForm from '@/components/course/CourseAdminForm';

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <div className="ga-page min-h-screen"><CourseAdminForm mode="edit" courseId={resolvedParams.id} /></div>;
}
