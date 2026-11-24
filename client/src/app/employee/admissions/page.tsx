'use client';

import AdminAdmissionsPage from '@/app/admin/admissions/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function EmployeeAdmissionsPage() {
  return (
    <PermissionRouteGuard anyOf={[PERMISSIONS.ADMISSIONS_VIEW, PERMISSIONS.ADMISSIONS_CREATE]}>
      <AdminAdmissionsPage />
    </PermissionRouteGuard>
  );
}
