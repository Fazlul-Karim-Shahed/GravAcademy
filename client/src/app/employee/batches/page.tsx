'use client';

import AdminBatchesPage from '@/app/admin/batches/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function EmployeeBatchesPage() {
  return (
    <PermissionRouteGuard
      anyOf={[
        PERMISSIONS.BATCHES_VIEW,
        PERMISSIONS.BATCHES_MANAGE,
        PERMISSIONS.BATCHES_DUPLICATE,
        PERMISSIONS.LESSONS_MANAGE,
        PERMISSIONS.EXAMS_MANAGE,
      ]}
    >
      <AdminBatchesPage />
    </PermissionRouteGuard>
  );
}
