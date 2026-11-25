'use client';
import { use } from 'react';
import CourseAdminForm from '@/components/course/CourseAdminForm';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EditEmployeeCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PermissionRouteGuard anyOf={[PERMISSIONS.COURSES_UPDATE]}><main className="ga-page ga-admin-page ga-form-page overflow-x-clip"><CourseAdminForm mode="edit" courseId={id} /></main></PermissionRouteGuard>;
}
