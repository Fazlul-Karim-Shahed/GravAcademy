'use client';

import FreeClassesPage from '@/app/free-classes/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';

/** Keeps management-only access to the public free-classes screen explicit. */
export default function EmployeeFreeClassesPage() {
  return (
    <PermissionRouteGuard anyOf={[PERMISSIONS.LIVE_CLASSES_MANAGE]}>
      <FreeClassesPage />
    </PermissionRouteGuard>
  );
}
