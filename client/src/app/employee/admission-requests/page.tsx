'use client';

import AdmissionRequestsPage from '@/app/admin/admission-requests/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function EmployeeAdmissionRequestsPage() {
  return (
    <PermissionRouteGuard anyOf={[PERMISSIONS.ADMISSIONS_VIEW, PERMISSIONS.ADMISSIONS_CREATE]}>
      <AdmissionRequestsPage />
    </PermissionRouteGuard>
  );
}
