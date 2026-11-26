'use client';

import AdminFinancePage from '@/app/admin/finance/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function EmployeeFinancePage() {
  return (
    <PermissionRouteGuard anyOf={[PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_COLLECT, PERMISSIONS.FINANCE_REFUND, PERMISSIONS.FINANCE_DELETE, PERMISSIONS.FINANCE_MANUAL_PAID]}>
      <AdminFinancePage />
    </PermissionRouteGuard>
  );
}
