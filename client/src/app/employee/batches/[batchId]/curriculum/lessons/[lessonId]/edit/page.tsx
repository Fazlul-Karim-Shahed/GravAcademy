'use client';
import EditLesson from '@/app/admin/batches/[batchId]/curriculum/lessons/[lessonId]/edit/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeEditLesson({ params }: { params: Promise<{ batchId: string; lessonId: string }> }) {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.LESSONS_MANAGE]}><EditLesson params={params} /></PermissionRouteGuard>;
}
