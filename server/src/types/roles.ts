export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  GUARDIAN: 'guardian',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Course Management
  COURSES_VIEW: 'courses.view',
  COURSES_CREATE: 'courses.create',
  COURSES_UPDATE: 'courses.update',
  COURSES_DELETE: 'courses.delete',
  COURSES_PUBLISH: 'courses.publish',

  // Academic Classes & Subjects
  CLASSES_MANAGE: 'classes.manage',

  // Batch & Curriculum Management
  BATCHES_VIEW: 'batches.view',
  BATCHES_MANAGE: 'batches.manage',
  BATCHES_DUPLICATE: 'batches.duplicate',
  LESSONS_MANAGE: 'lessons.manage',

  // Documents & Media
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_DELETE: 'documents.delete',

  // Exams & Assignments
  EXAMS_MANAGE: 'exams.manage',
  EXAMS_TAKE: 'exams.take',
  RESULTS_VIEW_SELF: 'results.view.self',
  RESULTS_VIEW_ALL: 'results.view.all',
  ASSIGNMENTS_MANAGE: 'assignments.manage',
  ASSIGNMENTS_SUBMIT: 'assignments.submit',

  // Live Classes & Sessions
  LIVE_CLASSES_MANAGE: 'live_classes.manage',
  LIVE_CLASSES_JOIN: 'live_classes.join',
  ATTENDANCE_MANAGE: 'attendance.manage',
  ATTENDANCE_VIEW: 'attendance.view',

  // Users & Platform Administration
  USERS_MANAGE: 'users.manage',
  PERMISSIONS_MANAGE: 'permissions.manage',
  AUDIT_LOGS_VIEW: 'audit_logs.view',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: 'Courses & Academics' | 'Batches & Curriculum' | 'Live Classes' | 'Exams & Homework' | 'Documents & Media' | 'Administration';
  description: string;
}

export const ALL_PERMISSIONS_METADATA: PermissionDefinition[] = [
  // Courses & Academics
  {
    key: PERMISSIONS.COURSES_VIEW,
    label: 'কোর্সসমূহ দেখুন (View Courses)',
    category: 'Courses & Academics',
    description: 'প্ল্যাটফর্মের সকল কোর্স এবং বিবরণ দেখতে পারে',
  },
  {
    key: PERMISSIONS.COURSES_CREATE,
    label: 'নতুন কোর্স তৈরি (Create Course)',
    category: 'Courses & Academics',
    description: 'নতুন কোর্স যোগ করার ক্ষমতা',
  },
  {
    key: PERMISSIONS.COURSES_UPDATE,
    label: 'কোর্স সম্পাদন (Edit Course)',
    category: 'Courses & Academics',
    description: 'বিদ্যমান কোর্সের ফি, মেয়াদ বা তথ্য পরিবর্তন করতে পারে',
  },
  {
    key: PERMISSIONS.COURSES_DELETE,
    label: 'কোর্স মুছুন (Delete Course)',
    category: 'Courses & Academics',
    description: 'ডাটাবেস থেকে যেকোনো কোর্স ডিলিট করার ক্ষমতা',
  },
  {
    key: PERMISSIONS.COURSES_PUBLISH,
    label: 'কোর্স পাবলিশ (Publish Course)',
    category: 'Courses & Academics',
    description: 'কোর্স লাইভ বা আনপাবলিশ করার ক্ষমতা',
  },
  {
    key: PERMISSIONS.CLASSES_MANAGE,
    label: 'ক্লাস ও সাবজেক্ট ম্যানেজ (Manage Classes/Subjects)',
    category: 'Courses & Academics',
    description: 'শ্রেণি ও বিষয়সমূহ তৈরি বা সম্পাদন করতে পারে',
  },

  // Batches & Curriculum
  {
    key: PERMISSIONS.BATCHES_VIEW,
    label: 'ব্যাচ তালিকা দেখুন (View Batches)',
    category: 'Batches & Curriculum',
    description: 'সকল ব্যাচ ও তালিকা পর্যবেক্ষণ করতে পারে',
  },
  {
    key: PERMISSIONS.BATCHES_MANAGE,
    label: 'ব্যাচ তৈরি ও সম্পাদন (Manage Batches)',
    category: 'Batches & Curriculum',
    description: 'নতুন ব্যাচ খোলা, ফি ও সময়সূচী নির্ধারণ করা',
  },
  {
    key: PERMISSIONS.BATCHES_DUPLICATE,
    label: 'ব্যাচ ক্লোনিং / ডুপ্লিকেট (Clone Batch)',
    category: 'Batches & Curriculum',
    description: 'অন্য ব্যাচ থেকে কারিকুলাম হুবহু ক্লোন করার ক্ষমতা',
  },
  {
    key: PERMISSIONS.LESSONS_MANAGE,
    label: 'মডিউল ও লেসন সাজানো (Manage Lessons)',
    category: 'Batches & Curriculum',
    description: 'সিলেবাসে মডিউল, সেকশন ও ভিডিও লেকচার যোগ করা',
  },

  // Live Classes
  {
    key: PERMISSIONS.LIVE_CLASSES_MANAGE,
    label: 'লাইভ ক্লাস ক্রিয়েট ও শুরু করা (Create & Manage Live Class)',
    category: 'Live Classes',
    description: 'জুম বা গুগল মিট লাইভ ক্লাস হোস্ট, শিডিউল ও এডিট করা',
  },
  {
    key: PERMISSIONS.LIVE_CLASSES_JOIN,
    label: 'লাইভ ক্লাসে অংশ নেওয়া (Join Live Class)',
    category: 'Live Classes',
    description: 'নির্ধারিত সময়ে সরাসরি লাইভ ক্লাসে যুক্ত হওয়া',
  },
  {
    key: PERMISSIONS.ATTENDANCE_MANAGE,
    label: 'হাজিরা নেওয়া (Manage Attendance)',
    category: 'Live Classes',
    description: 'শিক্ষার্থীদের উপস্থিতি রেকর্ড ও পরিবর্তন করা',
  },
  {
    key: PERMISSIONS.ATTENDANCE_VIEW,
    label: 'হাজিরা রিপোর্ট দেখা (View Attendance)',
    category: 'Live Classes',
    description: 'শিক্ষার্থীদের উপস্থিতির হিসেব ও রিপোর্ট দেখা',
  },

  // Exams & Homework
  {
    key: PERMISSIONS.EXAMS_MANAGE,
    label: 'পরীক্ষা ও কুইজ তৈরি (Manage Exams)',
    category: 'Exams & Homework',
    description: 'অনলাইন প্রশ্ন তৈরি ও মূল্যায়ন করা',
  },
  {
    key: PERMISSIONS.EXAMS_TAKE,
    label: 'পরীক্ষায় অংশগ্রহণ (Take Exams)',
    category: 'Exams & Homework',
    description: 'অনলাইন টেস্ট ও অ্যাসাইনমেন্ট সম্পন্ন করা',
  },
  {
    key: PERMISSIONS.RESULTS_VIEW_SELF,
    label: 'নিজের ফলাফল দেখা (View Own Result)',
    category: 'Exams & Homework',
    description: 'নিজের প্রাপ্ত নম্বর ও রেজাল্ট শিট দেখা',
  },
  {
    key: PERMISSIONS.RESULTS_VIEW_ALL,
    label: 'সকলের ফলাফল পর্যালোচনা (View All Results)',
    category: 'Exams & Homework',
    description: 'ব্যাচের সব শিক্ষার্থীর রেজাল্ট ও পারফরম্যান্স দেখা',
  },
  {
    key: PERMISSIONS.ASSIGNMENTS_MANAGE,
    label: 'হোমওয়ার্ক ও অ্যাসাইনমেন্ট ম্যানেজ',
    category: 'Exams & Homework',
    description: 'অ্যাসাইনমেন্ট দেওয়া ও গ্রেডিং করা',
  },
  {
    key: PERMISSIONS.ASSIGNMENTS_SUBMIT,
    label: 'অ্যাসাইনমেন্ট জমা দেওয়া (Submit Assignment)',
    category: 'Exams & Homework',
    description: 'অ্যাসাইনমেন্টের উত্তর বা ফাইল সাবমিট করা',
  },

  // Documents & Media
  {
    key: PERMISSIONS.DOCUMENTS_UPLOAD,
    label: 'লেকচার শিট ও ফাইল আপলোড (Upload Docs)',
    category: 'Documents & Media',
    description: 'পিডিএফ, লেকচার শিট ও স্টাডি মেটেরিয়াল আপলোড করা',
  },
  {
    key: PERMISSIONS.DOCUMENTS_VIEW,
    label: 'নোট ও ডকুমেন্টস দেখা (View Docs)',
    category: 'Documents & Media',
    description: 'শেয়ারকৃত স্টাডি মেটেরিয়াল ও নোট ওপেন করা',
  },
  {
    key: PERMISSIONS.DOCUMENTS_DELETE,
    label: 'ডকুমেন্ট মুছুন (Delete Docs)',
    category: 'Documents & Media',
    description: 'আপলোড করা ফাইল বা ডকুমেন্ট মুছে ফেলা',
  },

  // Administration
  {
    key: PERMISSIONS.USERS_MANAGE,
    label: 'ইউজার ম্যানেজমেন্ট (Manage Users & Roles)',
    category: 'Administration',
    description: 'ব্যবহারকারীদের রোল পরিবর্তন ও কাস্টম পারমিশন প্রদান',
  },
  {
    key: PERMISSIONS.PERMISSIONS_MANAGE,
    label: 'পারমিশন কনফিগারেশন (Manage Permissions)',
    category: 'Administration',
    description: 'বিশেষ সুবিধা বা অতিরিক্ত অধিকার অর্পণ করা',
  },
  {
    key: PERMISSIONS.AUDIT_LOGS_VIEW,
    label: 'অডিট লগ পর্যবেক্ষণ (Audit Logs)',
    category: 'Administration',
    description: 'প্ল্যাটফর্মে কার কি কার্যকলাপ হয়েছে তার লগ দেখা',
  },
  {
    key: PERMISSIONS.SETTINGS_MANAGE,
    label: 'সিস্টেম সেটিংস (System Settings)',
    category: 'Administration',
    description: 'প্লাটফর্ম সেটিংস ও পেমেন্ট কনফিগারেশন',
  },
];

// Default baseline permissions per role
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  [ROLES.SUPERADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.COURSES_PUBLISH,
    PERMISSIONS.CLASSES_MANAGE,
    PERMISSIONS.BATCHES_VIEW,
    PERMISSIONS.BATCHES_MANAGE,
    PERMISSIONS.BATCHES_DUPLICATE,
    PERMISSIONS.LESSONS_MANAGE,
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_DELETE,
    PERMISSIONS.EXAMS_MANAGE,
    PERMISSIONS.RESULTS_VIEW_ALL,
    PERMISSIONS.ASSIGNMENTS_MANAGE,
    PERMISSIONS.LIVE_CLASSES_MANAGE,
    PERMISSIONS.LIVE_CLASSES_JOIN,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.PERMISSIONS_MANAGE,
  ],
  [ROLES.TEACHER]: [
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.BATCHES_VIEW,
    PERMISSIONS.LESSONS_MANAGE,
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.EXAMS_MANAGE,
    PERMISSIONS.RESULTS_VIEW_ALL,
    PERMISSIONS.ASSIGNMENTS_MANAGE,
    PERMISSIONS.LIVE_CLASSES_MANAGE,
    PERMISSIONS.LIVE_CLASSES_JOIN,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.ATTENDANCE_VIEW,
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.BATCHES_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.EXAMS_TAKE,
    PERMISSIONS.RESULTS_VIEW_SELF,
    PERMISSIONS.ASSIGNMENTS_SUBMIT,
    PERMISSIONS.LIVE_CLASSES_JOIN,
    PERMISSIONS.ATTENDANCE_VIEW,
  ],
  [ROLES.GUARDIAN]: [
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.BATCHES_VIEW,
    PERMISSIONS.RESULTS_VIEW_SELF,
    PERMISSIONS.ATTENDANCE_VIEW,
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.BATCHES_VIEW,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
  ],
};
