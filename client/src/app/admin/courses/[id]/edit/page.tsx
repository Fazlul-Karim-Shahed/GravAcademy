'use client';

import { use } from 'react';
import CourseAdminForm from '@/components/course/CourseAdminForm';

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <main className="ga-page ga-admin-page ga-form-page overflow-x-clip"><CourseAdminForm mode="edit" courseId={resolvedParams.id} /></main>;
}
