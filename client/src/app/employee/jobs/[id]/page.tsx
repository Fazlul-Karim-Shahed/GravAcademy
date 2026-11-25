'use client';
import AdminJobEditPage from '@/app/admin/jobs/[id]/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeJobEditPage({ params }: { params: Promise<{ id?: string }> }) {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.JOBS_MANAGE]}><AdminJobEditPage params={params} /></PermissionRouteGuard>;
}
