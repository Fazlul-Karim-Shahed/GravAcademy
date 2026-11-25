'use client';

import CompanyExpensesPage from '@/app/admin/finance/company-expenses/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function EmployeeCompanyExpensesPage() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.FINANCE_VIEW]}><CompanyExpensesPage /></PermissionRouteGuard>;
}
