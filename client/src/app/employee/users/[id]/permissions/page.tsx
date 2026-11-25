'use client';
import Page from '@/app/admin/users/[id]/permissions/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeUserPermissions() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.PERMISSIONS_MANAGE]}><Page /></PermissionRouteGuard>;
}
