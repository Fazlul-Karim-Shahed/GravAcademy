'use client';

import AuditLogsPage from '@/app/admin/audit-logs/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function EmployeeAuditLogsPage() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.AUDIT_LOGS_VIEW]}><AuditLogsPage /></PermissionRouteGuard>;
}
