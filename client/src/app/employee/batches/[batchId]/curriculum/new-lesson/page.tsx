'use client';
import NewLesson from '@/app/admin/batches/[batchId]/curriculum/new-lesson/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeNewLesson({ params }: { params: Promise<{ batchId: string }> }) {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.LESSONS_MANAGE]}><NewLesson params={params} /></PermissionRouteGuard>;
}
