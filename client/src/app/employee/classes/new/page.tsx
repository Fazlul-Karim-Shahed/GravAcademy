'use client';
import NewClass from '@/app/admin/classes/new/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeNewClass() { return <PermissionRouteGuard anyOf={[PERMISSIONS.CLASSES_MANAGE]}><NewClass /></PermissionRouteGuard>; }
