'use client';
import Page from '@/app/admin/attendance/manual/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeManualAttendance() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE]}><Page /></PermissionRouteGuard>;
}
