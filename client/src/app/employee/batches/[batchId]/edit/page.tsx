'use client';
import EditBatch from '@/app/admin/batches/[batchId]/edit/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeEditBatch() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.BATCHES_MANAGE]}><EditBatch /></PermissionRouteGuard>;
}
