'use client';
import EditClass from '@/app/admin/classes/[id]/edit/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { PERMISSIONS } from '@/lib/permissions';
export default function EmployeeEditClass() { return <PermissionRouteGuard anyOf={[PERMISSIONS.CLASSES_MANAGE]}><EditClass /></PermissionRouteGuard>; }
