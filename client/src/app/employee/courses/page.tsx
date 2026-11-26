'use client';

import AdminCoursesPage from '@/app/admin/courses/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function EmployeeCoursesPage() {
  return (
    <PermissionRouteGuard
      anyOf={[
        PERMISSIONS.COURSES_VIEW,
        PERMISSIONS.COURSES_CREATE,
        PERMISSIONS.COURSES_UPDATE,
        PERMISSIONS.COURSES_DELETE,
        PERMISSIONS.CLASSES_MANAGE,
      ]}
    >
      <AdminCoursesPage />
    </PermissionRouteGuard>
  );
}
