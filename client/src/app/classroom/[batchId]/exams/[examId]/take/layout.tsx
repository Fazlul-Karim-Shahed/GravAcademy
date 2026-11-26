import EmployeeClassroomPermissionGuard from '@/components/common/EmployeeClassroomPermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function ExamTakeLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeClassroomPermissionGuard anyOf={[PERMISSIONS.EXAMS_TAKE]}>{children}</EmployeeClassroomPermissionGuard>;
}
