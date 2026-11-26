import EmployeeClassroomPermissionGuard from '@/components/common/EmployeeClassroomPermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function ExamSubmissionsLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeClassroomPermissionGuard anyOf={[PERMISSIONS.EXAMS_MANAGE, PERMISSIONS.EXAMS_EVALUATE]}>{children}</EmployeeClassroomPermissionGuard>;
}
