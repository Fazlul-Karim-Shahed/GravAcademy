'use client';
import NewBatch from '@/app/admin/batches/new/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeNewBatch() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.BATCHES_MANAGE, PERMISSIONS.BATCHES_DUPLICATE]}><NewBatch /></PermissionRouteGuard>;
}
