import EmployeeClassroomPermissionGuard from '@/components/common/EmployeeClassroomPermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function MarksheetLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeClassroomPermissionGuard anyOf={[PERMISSIONS.EXAMS_MANAGE, PERMISSIONS.RESULTS_VIEW_ALL, PERMISSIONS.RESULTS_VIEW_SELF]}>{children}</EmployeeClassroomPermissionGuard>;
}
