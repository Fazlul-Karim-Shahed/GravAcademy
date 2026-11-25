'use client';
import Page from '@/app/admin/users/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeUsers() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.USERS_MANAGE, PERMISSIONS.PERMISSIONS_MANAGE]}><Page /></PermissionRouteGuard>;
}
