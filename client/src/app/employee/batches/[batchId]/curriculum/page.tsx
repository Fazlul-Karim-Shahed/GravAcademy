'use client';
import Curriculum from '@/app/admin/batches/[batchId]/curriculum/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeCurriculum({ params }: { params: Promise<{ batchId: string }> }) {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.LESSONS_MANAGE]}><Curriculum params={params} /></PermissionRouteGuard>;
}
