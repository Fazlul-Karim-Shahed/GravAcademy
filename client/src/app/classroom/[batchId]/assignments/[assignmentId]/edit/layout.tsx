import EmployeeClassroomPermissionGuard from '@/components/common/EmployeeClassroomPermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function AssignmentEditLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeClassroomPermissionGuard anyOf={[PERMISSIONS.EXAMS_MANAGE, PERMISSIONS.ASSIGNMENTS_MANAGE]}>{children}</EmployeeClassroomPermissionGuard>;
}
