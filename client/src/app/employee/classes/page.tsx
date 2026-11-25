'use client';
import Classes from '@/app/admin/classes/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeClasses() { return <PermissionRouteGuard anyOf={[PERMISSIONS.CLASSES_MANAGE]}><Classes /></PermissionRouteGuard>; }
