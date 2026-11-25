'use client';
import Page from '@/app/admin/attendance/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeAttendance() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE]}><Page /></PermissionRouteGuard>;
}
