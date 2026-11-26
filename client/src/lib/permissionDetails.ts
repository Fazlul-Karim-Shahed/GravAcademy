import { PermissionKey, PERMISSIONS } from './permissions';

export interface PermissionDetail {
  summary: string;
  grants: string[];
  note?: string;
}

/**
 * Plain-language help shown beside every permission in the employee permission editor.
 * Keep these descriptions focused on what the employee will actually see or be able to do.
 */
export const DASHBOARD_PERMISSION_DETAILS: Partial<Record<PermissionKey, PermissionDetail>> = {
  [PERMISSIONS.ADMISSIONS_VIEW]: {
    summary: 'কর্মী ভর্তি সংক্রান্ত তথ্য দেখতে পারবে, তবে এই অনুমতি দিয়ে নতুন ভর্তি বা কোনো ভর্তি পরিবর্তন করতে পারবে না।',
    grants: ['সাম্প্রতিক ভর্তি হওয়া শিক্ষার্থীদের তালিকা দেখতে পারবে', 'ভর্তি Request ও ভর্তি-সংক্রান্ত প্রয়োজনীয় তথ্য দেখতে পারবে', 'ভর্তির বিস্তারিত তথ্য খুলে দেখতে পারবে'],
  },
  [PERMISSIONS.ADMISSIONS_CREATE]: {
    summary: 'কর্মী নতুন শিক্ষার্থী ভর্তি করতে এবং আসা ভর্তি Request নিয়ে কাজ করতে পারবে।',
    grants: ['নতুন শিক্ষার্থী ভর্তি করার ফর্ম খুলতে পারবে', 'শিক্ষার্থীকে নির্বাচিত কোর্স ও ব্যাচে ভর্তি করতে পারবে', 'ভর্তি Request অনুমোদন বা বাতিল করতে পারবে'],
    note: 'এই অনুমতি দিলেই পুরোনো ভর্তি বাতিল বা ব্যাচ পরিবর্তনের অধিকার পাওয়া যাবে না। সেগুলোর আলাদা অনুমতি আছে।',
  },
  [PERMISSIONS.ADMISSIONS_SHIFT]: {
    summary: 'ইতিমধ্যে ভর্তি হওয়া শিক্ষার্থীকে এক ব্যাচ থেকে অন্য ব্যাচে সরাতে পারবে।',
    grants: ['শিক্ষার্থীর বর্তমান ব্যাচ দেখতে পারবে', 'উপযুক্ত নতুন ব্যাচ নির্বাচন করতে পারবে', 'নিশ্চিত করার পর শিক্ষার্থীর ব্যাচ পরিবর্তন করতে পারবে'],
  },
  [PERMISSIONS.ADMISSIONS_REMOVE]: {
    summary: 'কর্মী কোনো শিক্ষার্থীর ভর্তি বাতিল করতে বা তাকে ব্যাচ থেকে সরাতে পারবে।',
    grants: ['ভর্তি বাতিলের action দেখতে পারবে', 'শিক্ষার্থীকে ব্যাচ থেকে অপসারণ করতে পারবে', 'বাতিলের কারণ লিখে পরিবর্তন নিশ্চিত করতে পারবে'],
    note: 'এটি গুরুত্বপূর্ণ ও সংবেদনশীল অনুমতি। প্রয়োজন ছাড়া দেওয়া উচিত নয়।',
  },
  [PERMISSIONS.COURSES_VIEW]: {
    summary: 'কর্মী কোর্সের তালিকা ও কোর্সের তথ্য দেখতে পারবে, কিন্তু পরিবর্তন করতে পারবে না।',
    grants: ['সব কোর্সের তালিকা দেখতে পারবে', 'কোর্সের বিস্তারিত তথ্য খুলতে পারবে', 'কোর্সের বর্তমান অবস্থা ও প্রয়োজনীয় তথ্য দেখতে পারবে'],
  },
  [PERMISSIONS.COURSES_CREATE]: {
    summary: 'কর্মী নতুন কোর্স তৈরি করতে পারবে।',
    grants: ['নতুন কোর্স তৈরির বাটন ও ফর্ম দেখতে পারবে', 'কোর্সের নাম, ফি, বিবরণ ও প্রয়োজনীয় তথ্য দিতে পারবে', 'তথ্য পূরণ করে নতুন কোর্স সংরক্ষণ করতে পারবে'],
  },
  [PERMISSIONS.COURSES_UPDATE]: {
    summary: 'কর্মী বিদ্যমান কোর্সের তথ্য ও প্রকাশনার অবস্থা পরিবর্তন করতে পারবে।',
    grants: ['কোর্স Edit পেজ খুলতে পারবে', 'কোর্সের তথ্য, ফি, ছবি ও অন্যান্য সেটিংস বদলাতে পারবে', 'কোর্স প্রকাশ বা অপ্রকাশ করার নিয়ন্ত্রণ ব্যবহার করতে পারবে'],
  },
  [PERMISSIONS.COURSES_DELETE]: {
    summary: 'কর্মী বিদ্যমান কোর্স মুছে ফেলতে পারবে।',
    grants: ['কোর্সের Delete action দেখতে পারবে', 'নিশ্চিত করার পর কোর্স মুছে ফেলতে পারবে'],
    note: 'এটি গুরুত্বপূর্ণ ও সংবেদনশীল অনুমতি। কোর্সের সঙ্গে যুক্ত তথ্যের ওপর প্রভাব পড়তে পারে।',
  },
  [PERMISSIONS.CLASSES_MANAGE]: {
    summary: 'কর্মী কোর্সে ব্যবহৃত Class ও Subject সম্পূর্ণভাবে পরিচালনা করতে পারবে।',
    grants: ['Class ও Subject-এর তালিকা দেখতে পারবে', 'নতুন Class বা Subject তৈরি করতে পারবে', 'বিদ্যমান Class বা Subject এডিট করতে পারবে', 'প্রয়োজনে Class বা Subject ডিলিট করতে পারবে'],
  },
  [PERMISSIONS.BATCHES_VIEW]: {
    summary: 'কর্মী ব্যাচের তথ্য শুধু দেখতে পারবে; তৈরি, এডিট বা ডিলিট করতে পারবে না।',
    grants: ['সব ব্যাচের তালিকা দেখতে পারবে', 'ব্যাচের সময়সূচি, আসন ও অন্যান্য তথ্য দেখতে পারবে', 'ব্যাচের বিস্তারিত পেজ খুলতে পারবে'],
  },
  [PERMISSIONS.BATCHES_MANAGE]: {
    summary: 'কর্মী নতুন ব্যাচ তৈরি এবং বিদ্যমান ব্যাচের সাধারণ তথ্য পরিবর্তন করতে পারবে।',
    grants: ['নতুন ব্যাচ তৈরির ফর্ম খুলতে পারবে', 'কোর্স, সময়সূচি, ফি, আসন ও শিক্ষক সংক্রান্ত তথ্য দিতে পারবে', 'বিদ্যমান ব্যাচের তথ্য এডিট ও সংরক্ষণ করতে পারবে'],
    note: 'ক্লাসরুম, কারিকুলাম, ডুপ্লিকেট ও ডিলিটের জন্য আলাদা অনুমতি আছে।',
  },
  [PERMISSIONS.BATCHES_DELETE]: {
    summary: 'কর্মী কোনো ব্যাচ মুছে ফেলতে পারবে।',
    grants: ['ব্যাচের Delete action দেখতে পারবে', 'নিশ্চিত করার পর ব্যাচ ডিলিট করতে পারবে'],
    note: 'এটি গুরুত্বপূর্ণ ও সংবেদনশীল অনুমতি। ভর্তি শিক্ষার্থী বা ব্যাচের কনটেন্ট থাকলে প্রভাব পড়তে পারে।',
  },
  [PERMISSIONS.BATCHES_DUPLICATE]: {
    summary: 'কর্মী পুরোনো ব্যাচের তথ্য ব্যবহার করে দ্রুত আরেকটি নতুন ব্যাচ তৈরি করতে পারবে।',
    grants: ['ব্যাচের Duplicate action দেখতে পারবে', 'কোন তথ্য কপি হবে তা দেখে নতুন ব্যাচ তৈরি করতে পারবে', 'কপি করা ব্যাচের তথ্য পরে প্রয়োজনমতো পরিবর্তন করতে পারবে'],
  },
  [PERMISSIONS.EXAMS_MANAGE]: {
    summary: 'এটি পুরো Classroom পরিচালনার একটি পূর্ণ অনুমতি। কর্মী ব্যাচের Classroom-এর ভেতরের একাডেমিক কাজগুলো করতে পারবে।',
    grants: ['ব্যাচের Classroom খুলতে ও পরিচালনা করতে পারবে', 'পরীক্ষা ও কুইজ তৈরি, এডিট, মূল্যায়ন ও ফলাফল পরিচালনা করতে পারবে', 'অ্যাসাইনমেন্ট তৈরি, এডিট, সাবমিশন দেখা ও গ্রেড দিতে পারবে', 'মার্কশিট ও শিক্ষার্থীদের ফলাফল দেখতে পারবে', 'Classroom announcement, discussion এবং সংশ্লিষ্ট live-class কাজ ব্যবহার করতে পারবে'],
    note: 'এই একটি অনুমতির সঙ্গে Classroom-এর প্রয়োজনীয় Exam, Assignment ও Result access একসঙ্গে চালু হয়।',
  },
  [PERMISSIONS.LESSONS_MANAGE]: {
    summary: 'কর্মী ব্যাচের সম্পূর্ণ Curriculum বা Syllabus সাজাতে পারবে।',
    grants: ['Curriculum পেজ খুলতে পারবে', 'Module, Section ও Lesson তৈরি করতে পারবে', 'ভিডিও, ফাইল বা অন্যান্য lesson content যোগ ও পরিবর্তন করতে পারবে', 'Curriculum-এর item সাজাতে বা মুছে ফেলতে পারবে'],
  },
  [PERMISSIONS.LIVE_CLASSES_MANAGE]: {
    summary: 'কর্মী Free Class ও Seminar-এর সব সাধারণ ব্যবস্থাপনার কাজ করতে পারবে।',
    grants: ['Free Class ও Seminar-এর তালিকা দেখতে পারবে', 'নতুন Free Class বা Seminar তৈরি করতে পারবে', 'বিদ্যমান item এডিট করতে পারবে', 'প্রয়োজনে item ডিলিট করতে পারবে'],
  },
  [PERMISSIONS.JOBS_VIEW]: {
    summary: 'কর্মী Job Circular-এর তালিকা ও বিস্তারিত শুধু দেখতে পারবে।',
    grants: ['সব Job Circular দেখতে পারবে', 'একটি বিজ্ঞপ্তির বিস্তারিত তথ্য খুলতে পারবে'],
  },
  [PERMISSIONS.JOBS_MANAGE]: {
    summary: 'কর্মী Job Circular ও এর Category সম্পূর্ণভাবে পরিচালনা করতে পারবে।',
    grants: ['নতুন Job Circular তৈরি করতে পারবে', 'বিজ্ঞপ্তি এডিট বা ডিলিট করতে পারবে', 'Job Category তৈরি, এডিট বা ডিলিট করতে পারবে'],
  },
  [PERMISSIONS.USERS_MANAGE]: {
    summary: 'কর্মী ব্যবহারকারীদের তালিকা ও সাধারণ অ্যাকাউন্ট তথ্য পরিচালনা করতে পারবে।',
    grants: ['User list ও profile তথ্য দেখতে পারবে', 'নতুন User তৈরি করতে পারবে', 'User-এর সাধারণ তথ্য ও account status পরিবর্তন করতে পারবে', 'অনুমোদিত User-management action ব্যবহার করতে পারবে'],
    note: 'অন্য কারও Role বা Permission বদলাতে “রোল ও পারমিশন পরিবর্তন করুন” অনুমতিটিও লাগবে।',
  },
  [PERMISSIONS.PERMISSIONS_MANAGE]: {
    summary: 'কর্মী অন্য ব্যবহারকারীর Role এবং Dashboard permission পরিবর্তন করতে পারবে।',
    grants: ['User-এর Permission Editor খুলতে পারবে', 'Role পরিবর্তন করতে পারবে', 'আলাদা Dashboard permission চালু বা বন্ধ করতে পারবে', 'পরিবর্তিত Role ও Permission সংরক্ষণ করতে পারবে'],
    note: 'এটি অত্যন্ত সংবেদনশীল অনুমতি। বিশ্বস্ত দায়িত্বপ্রাপ্ত ব্যক্তিকেই দেওয়া উচিত।',
  },
  [PERMISSIONS.FINANCE_VIEW]: {
    summary: 'কর্মী Finance পেজের আর্থিক তথ্য দেখতে পারবে, কিন্তু টাকা গ্রহণ, ফেরত বা রেকর্ড বদলাতে পারবে না।',
    grants: ['Payment ও transaction তালিকা দেখতে পারবে', 'বকেয়া, আয়-ব্যয় ও summary দেখতে পারবে', 'Receipt ও payment history খুলে দেখতে পারবে'],
  },
  [PERMISSIONS.FINANCE_COLLECT]: {
    summary: 'কর্মী শিক্ষার্থীর ফি বা বকেয়া টাকা গ্রহণ করে payment record তৈরি করতে পারবে।',
    grants: ['Collect Payment action ব্যবহার করতে পারবে', 'Payment method, amount ও প্রয়োজনীয় তথ্য দিতে পারবে', 'Payment সংরক্ষণ করে receipt তৈরি করতে পারবে'],
  },
  [PERMISSIONS.FINANCE_REFUND]: {
    summary: 'কর্মী গ্রহণ করা টাকা Refund বা প্রয়োজনীয় Adjustment করতে পারবে।',
    grants: ['Refund/Adjustment action দেখতে পারবে', 'ফেরতের পরিমাণ ও কারণ লিখতে পারবে', 'নিশ্চিত করার পর আর্থিক রেকর্ড সমন্বয় করতে পারবে'],
    note: 'এটি সংবেদনশীল আর্থিক অনুমতি।',
  },
  [PERMISSIONS.FINANCE_MANUAL_PAID]: {
    summary: 'কর্মী স্বাভাবিক payment ছাড়াই কোনো বকেয়াকে বিশেষভাবে Paid বা মওকুফ হিসেবে চিহ্নিত করতে পারবে।',
    grants: ['Manual Paid action ব্যবহার করতে পারবে', 'বকেয়ার status Paid/মওকুফ করতে পারবে', 'প্রয়োজনে status আবার পরিবর্তন করতে পারবে'],
    note: 'এটি হিসাবের ওপর সরাসরি প্রভাব ফেলে, তাই কারণ যাচাই করে ব্যবহার করা উচিত।',
  },
  [PERMISSIONS.FINANCE_DELETE]: {
    summary: 'কর্মী ভুল Payment record মুছে ফেলতে পারবে।',
    grants: ['Payment-এর Delete action দেখতে পারবে', 'নিশ্চিত করার পর Payment record ডিলিট করতে পারবে'],
    note: 'এটি গুরুত্বপূর্ণ ও সংবেদনশীল আর্থিক অনুমতি।',
  },
  [PERMISSIONS.FINANCE_EXPENSE_MANAGE]: {
    summary: 'কর্মী কোম্পানির Manual Expense পরিচালনা করতে পারবে।',
    grants: ['Company Expense পেজ খুলতে পারবে', 'নতুন খরচ যোগ করতে পারবে', 'Manual Expense এডিট করতে পারবে', 'Manual Expense ডিলিট করতে পারবে'],
    note: 'Teacher payment record আলাদা নিয়মে পরিচালিত হয়; Manual Expense-এর মতো সব action সেখানে পাওয়া যাবে না।',
  },
  [PERMISSIONS.ATTENDANCE_VIEW]: {
    summary: 'কর্মী শিক্ষকদের হাজিরা ও আগের রেকর্ড শুধু দেখতে পারবে।',
    grants: ['Teacher Attendance তালিকা দেখতে পারবে', 'নির্দিষ্ট শিক্ষকের attendance history খুলতে পারবে', 'হাজিরা ও সংশ্লিষ্ট summary দেখতে পারবে'],
  },
  [PERMISSIONS.ATTENDANCE_MANAGE]: {
    summary: 'কর্মী শিক্ষক হাজিরা এবং এর সঙ্গে যুক্ত শিক্ষক payment-এর কাজ পরিচালনা করতে পারবে।',
    grants: ['শিক্ষকের হাজিরা mark বা পরিবর্তন করতে পারবে', 'Schedule অনুযায়ী attendance পরিচালনা করতে পারবে', 'Teacher payment তৈরি ও অনুমোদিত পরিবর্তন করতে পারবে', 'Payment receipt ও সংশ্লিষ্ট action ব্যবহার করতে পারবে'],
  },
  [PERMISSIONS.SETTINGS_MANAGE]: {
    summary: 'কর্মী ওয়েবসাইট ও সিস্টেমের গুরুত্বপূর্ণ Settings পরিবর্তন করতে পারবে।',
    grants: ['Settings section খুলতে পারবে', 'Site ও Homepage-এর অনুমোদিত content/settings পরিবর্তন করতে পারবে', 'Google Drive cleanup ও সংশ্লিষ্ট maintenance action ব্যবহার করতে পারবে'],
    note: 'Settings-এর পরিবর্তন সবার দেখা সাইটে প্রভাব ফেলতে পারে।',
  },
  [PERMISSIONS.AUDIT_LOGS_VIEW]: {
    summary: 'কর্মী সিস্টেমে হওয়া গুরুত্বপূর্ণ ও সংবেদনশীল কাজের ইতিহাস দেখতে পারবে।',
    grants: ['Audit Log-এর তালিকা দেখতে পারবে', 'কে, কখন, কোন গুরুত্বপূর্ণ কাজ করেছে তা দেখতে পারবে', 'Log-এর বিস্তারিত তথ্য খুলে পর্যালোচনা করতে পারবে'],
    note: 'এই অনুমতি শুধু ইতিহাস দেখার জন্য; Log পরিবর্তন বা মুছে ফেলার অধিকার দেয় না।',
  },
};
