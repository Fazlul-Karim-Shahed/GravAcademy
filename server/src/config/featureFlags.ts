export const FEATURE_FLAGS = {
  admissions: 'admissions',
  courses: 'courses',
  batches: 'batches',
  freeClasses: 'freeClasses',
  jobs: 'jobs',
  userManagement: 'userManagement',
  finance: 'finance',
  exams: 'exams',
  assignments: 'assignments',
  liveClasses: 'liveClasses',
  reports: 'reports',
  auditLogs: 'auditLogs',
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  admissions: true,
  courses: true,
  batches: true,
  freeClasses: true,
  jobs: true,
  userManagement: true,
  finance: true,
  exams: true,
  assignments: true,
  liveClasses: true,
  reports: true,
  auditLogs: true,
};

export const FEATURE_FLAG_LABELS: Record<FeatureFlagKey, string> = {
  admissions: 'Admission',
  courses: 'Course Management',
  batches: 'Batch Management',
  freeClasses: 'Free Classes',
  jobs: 'Job Circulars',
  userManagement: 'User Management',
  finance: 'Finance Management',
  exams: 'Exam Management',
  assignments: 'Assignment Management',
  liveClasses: 'Live Classes',
  reports: 'Reports',
  auditLogs: 'Audit Logs',
};
