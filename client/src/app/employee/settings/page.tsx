'use client';
import AdminSettingsPage from '@/app/admin/settings/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeSettingsPage() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.SETTINGS_MANAGE]}><AdminSettingsPage /></PermissionRouteGuard>;
}
