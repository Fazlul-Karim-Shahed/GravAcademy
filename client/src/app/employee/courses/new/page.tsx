'use client';
import CourseAdminForm from '@/components/course/CourseAdminForm';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function NewEmployeeCoursePage() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.COURSES_CREATE]}><main className="ga-page ga-admin-page ga-form-page overflow-x-clip"><CourseAdminForm mode="create" /></main></PermissionRouteGuard>;
}
