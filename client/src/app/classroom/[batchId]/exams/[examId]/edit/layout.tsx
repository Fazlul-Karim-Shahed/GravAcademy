import EmployeeClassroomPermissionGuard from '@/components/common/EmployeeClassroomPermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function ExamEditLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeClassroomPermissionGuard anyOf={[PERMISSIONS.EXAMS_MANAGE]}>{children}</EmployeeClassroomPermissionGuard>;
}
