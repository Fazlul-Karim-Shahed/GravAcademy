'use client';
import AdminJobFormPage from '@/app/admin/jobs/new/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeNewJobPage() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.JOBS_MANAGE]}><AdminJobFormPage /></PermissionRouteGuard>;
}
