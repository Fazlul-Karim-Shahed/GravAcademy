import EmployeeClassroomPermissionGuard from '@/components/common/EmployeeClassroomPermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function AssignmentSubmitLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeClassroomPermissionGuard anyOf={[PERMISSIONS.ASSIGNMENTS_SUBMIT]}>{children}</EmployeeClassroomPermissionGuard>;
}
