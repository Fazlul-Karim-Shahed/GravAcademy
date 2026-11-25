'use client';
import Page from '@/app/admin/users/[id]/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeUserProfile() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.USERS_MANAGE, PERMISSIONS.PERMISSIONS_MANAGE]}><Page /></PermissionRouteGuard>;
}
