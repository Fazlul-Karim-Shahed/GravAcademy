import { Router } from 'express';
import multer from 'multer';
import { authenticate, optionalAuthenticate, requireRole, requirePermission } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { ROLES, PERMISSIONS } from '../types/roles';

// Controllers
import * as authCtrl from '../controllers/authController';
import * as courseCtrl from '../controllers/courseController';
import * as batchCtrl from '../controllers/batchController';
import * as contentCtrl from '../controllers/contentController';
import * as docCtrl from '../controllers/documentController';
import * as examCtrl from '../controllers/examController';
import * as liveCtrl from '../controllers/liveClassController';
import * as userAdminCtrl from '../controllers/userAdminController';
import * as academicClassCtrl from '../controllers/academicClassController';
import * as classroomCtrl from '../controllers/classroomController';
import * as enrollmentCtrl from '../controllers/enrollmentController';
import * as jobCtrl from '../controllers/jobPostController';
import * as financeCtrl from '../controllers/financeController';
import { requireFeature } from '../middleware/featureFlag';
import { FEATURE_FLAGS } from '../config/featureFlags';
import * as settingCtrl from '../controllers/settingController';
import * as guardianCtrl from '../controllers/guardianController';
import * as assignmentCtrl from '../controllers/assignmentController';
import * as marksheetCtrl from '../controllers/marksheetController';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// --- AUTH & PROFILE ROUTES ---
router.post('/auth/register', validateRequest(authCtrl.registerSchema), authCtrl.register);
router.post('/auth/login', validateRequest(authCtrl.loginSchema), authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.put('/auth/profile', authenticate, authCtrl.updateProfile);
router.post('/auth/avatar', authenticate, upload.single('avatar'), authCtrl.uploadAvatar);
router.get('/teachers', authCtrl.getPublicTeachers);

// --- ACADEMIC CLASS & SUBJECT HIERARCHY ROUTES ---
router.get('/classes', requireFeature(FEATURE_FLAGS.courses), academicClassCtrl.getAcademicClasses);
router.get('/classes/:idOrSlug', requireFeature(FEATURE_FLAGS.courses), academicClassCtrl.getClassByIdOrSlug);
router.post(
  '/classes',
  authenticate,
  requireFeature(FEATURE_FLAGS.courses),
  requirePermission(PERMISSIONS.COURSES_CREATE),
  validateRequest(academicClassCtrl.createClassSchema),
  academicClassCtrl.createAcademicClass
);
router.put(
  '/classes/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.courses),
  requirePermission(PERMISSIONS.COURSES_UPDATE),
  validateRequest(academicClassCtrl.updateClassSchema),
  academicClassCtrl.updateAcademicClass
);
router.delete(
  '/classes/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.courses),
  requirePermission(PERMISSIONS.COURSES_DELETE),
  academicClassCtrl.deleteAcademicClass
);

// --- COURSE ROUTES ---
router.get('/courses', requireFeature(FEATURE_FLAGS.courses), courseCtrl.getCourses);
router.get('/courses/:id', requireFeature(FEATURE_FLAGS.courses), courseCtrl.getCourseById);
router.post(
  '/courses',
  authenticate,
  requireFeature(FEATURE_FLAGS.courses),
  requirePermission(PERMISSIONS.COURSES_CREATE),
  validateRequest(courseCtrl.createCourseSchema),
  courseCtrl.createCourse
);
router.put(
  '/courses/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.courses),
  requirePermission(PERMISSIONS.COURSES_UPDATE),
  courseCtrl.updateCourse
);
router.delete(
  '/courses/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.courses),
  requirePermission(PERMISSIONS.COURSES_DELETE),
  courseCtrl.deleteCourse
);

// --- BATCH ROUTES (Including Copy-from-batch workflow & Weekly Schedule System) ---
router.get('/batches', requireFeature(FEATURE_FLAGS.batches), batchCtrl.getBatches);
router.get('/batches/schedule/overview', optionalAuthenticate, requireFeature(FEATURE_FLAGS.batches), batchCtrl.getScheduleOverview);
router.get('/batches/:id', requireFeature(FEATURE_FLAGS.batches), batchCtrl.getBatchById);
router.get('/batches/:batchId/hierarchy', requireFeature(FEATURE_FLAGS.batches), batchCtrl.getBatchHierarchy);
router.post(
  '/batches',
  authenticate,
  requireFeature(FEATURE_FLAGS.batches),
  requirePermission(PERMISSIONS.BATCHES_MANAGE),
  validateRequest(batchCtrl.createBatchSchema),
  batchCtrl.createBatch
);
router.put(
  '/batches/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.batches),
  requirePermission(PERMISSIONS.BATCHES_MANAGE),
  batchCtrl.updateBatch
);
router.delete(
  '/batches/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.batches),
  requirePermission(PERMISSIONS.BATCHES_MANAGE),
  batchCtrl.deleteBatch
);

// --- ENROLLMENT ROUTES ---
router.get(
  '/enrollments/my-status',
  authenticate,
  enrollmentCtrl.getMyEnrollmentStatus
);
router.get(
  '/enrollments/my-batches',
  authenticate,
  enrollmentCtrl.getMyBatches
);
router.post(
  '/enrollment-requests',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  validateRequest(enrollmentCtrl.createEnrollmentRequestSchema),
  enrollmentCtrl.createEnrollmentRequest
);
router.get(
  '/enrollment-requests/my',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  enrollmentCtrl.getMyEnrollmentRequests
);
// Admin Admission & Enrollment Routes
router.get(
  '/enrollment-requests/admin',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  requirePermission(PERMISSIONS.ADMISSIONS_VIEW),
  enrollmentCtrl.getAdminEnrollmentRequests
);
router.get(
  '/enrollment-requests/:requestId',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  requirePermission(PERMISSIONS.ADMISSIONS_VIEW),
  enrollmentCtrl.getEnrollmentRequestById
);
router.post(
  '/enrollment-requests/:requestId/approve',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  requirePermission(PERMISSIONS.ADMISSIONS_CREATE),
  enrollmentCtrl.approveEnrollmentRequest
);
router.post(
  '/enrollment-requests/:requestId/reject',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  requirePermission(PERMISSIONS.ADMISSIONS_CREATE),
  enrollmentCtrl.rejectEnrollmentRequest
);
router.post(
  '/enrollments/admin-admit',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  requirePermission(PERMISSIONS.ADMISSIONS_CREATE),
  validateRequest(enrollmentCtrl.adminAdmitStudentSchema),
  enrollmentCtrl.adminAdmitStudent
);
router.get(
  '/enrollments/admin-list',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  requirePermission(PERMISSIONS.ADMISSIONS_VIEW),
  enrollmentCtrl.getAdminEnrollments
);
router.delete(
  '/enrollments/:enrollmentId',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  requirePermission(PERMISSIONS.ADMISSIONS_REMOVE),
  enrollmentCtrl.removeStudentFromBatch
);
router.post(
  '/enrollments/cancel',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  requirePermission(PERMISSIONS.ADMISSIONS_REMOVE),
  enrollmentCtrl.removeStudentFromBatch
);
router.post(
  '/enrollments/shift',
  authenticate,
  requireFeature(FEATURE_FLAGS.admissions),
  requirePermission(PERMISSIONS.ADMISSIONS_SHIFT),
  enrollmentCtrl.shiftStudentBatch
);

// --- FINANCE & PAYMENT ROUTES ---
router.post(
  '/finance/collect-payment',
  authenticate,
  requireFeature(FEATURE_FLAGS.finance),
  requirePermission(PERMISSIONS.FINANCE_COLLECT),
  validateRequest(financeCtrl.collectPaymentSchema),
  financeCtrl.collectPayment
);
router.get(
  '/finance/admin-payments',
  authenticate,
  requireFeature(FEATURE_FLAGS.finance),
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  financeCtrl.getAdminPayments
);
router.get(
  '/finance/my-payments',
  authenticate,
  financeCtrl.getMyPayments
);
router.get(
  '/finance/student-batch-payments',
  authenticate,
  requireFeature(FEATURE_FLAGS.finance),
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  financeCtrl.getStudentBatchPayments
);
router.get(
  '/finance/receipts/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.finance),
  financeCtrl.getPaymentReceipt
);
router.post(
  '/finance/upload-document',
  authenticate,
  requireFeature(FEATURE_FLAGS.finance),
  upload.single('document'),
  financeCtrl.uploadPaymentDocument
);
router.delete(
  '/finance/payments/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.finance),
  requirePermission(PERMISSIONS.FINANCE_DELETE),
  financeCtrl.deletePayment
);
router.post(
  '/finance/refund-payment',
  authenticate,
  requireFeature(FEATURE_FLAGS.finance),
  requirePermission(PERMISSIONS.FINANCE_REFUND),
  financeCtrl.refundExcessPayment
);
router.post(
  '/finance/toggle-paid',
  authenticate,
  requireFeature(FEATURE_FLAGS.finance),
  requirePermission(PERMISSIONS.FINANCE_MANUAL_PAID),
  financeCtrl.toggleManualPaidStatus
);

// --- CLASSROOM, ANNOUNCEMENTS & DISCUSSION ROUTES ---
router.get('/classrooms/:batchId', authenticate, classroomCtrl.getClassroomOverview);
router.get('/classrooms/:batchId/members', authenticate, classroomCtrl.getClassroomMembers);
router.get('/classrooms/:batchId/announcements', authenticate, classroomCtrl.getAnnouncements);
router.post(
  '/classrooms/:batchId/announcements',
  authenticate,
  validateRequest(classroomCtrl.createAnnouncementSchema),
  classroomCtrl.createAnnouncement
);
router.get('/classrooms/:batchId/discussions', authenticate, classroomCtrl.getDiscussionMessages);
router.post(
  '/classrooms/:batchId/discussions',
  authenticate,
  validateRequest(classroomCtrl.createDiscussionSchema),
  classroomCtrl.postDiscussionMessage
);

// --- CONTENT HIERARCHY ROUTES ---
// Modules
router.post(
  '/modules',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.createModule
);
router.put(
  '/modules/:id',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.updateModule
);
router.delete(
  '/modules/:id',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.deleteModule
);
router.post(
  '/modules/reorder',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.reorderModules
);

// Sections
router.post(
  '/sections',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.createSection
);
router.put(
  '/sections/:id',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.updateSection
);
router.delete(
  '/sections/:id',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.deleteSection
);

// Lessons
router.post(
  '/lessons',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.createLesson
);
router.put(
  '/lessons/:id',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.updateLesson
);
router.delete(
  '/lessons/:id',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.deleteLesson
);
router.post(
  '/lessons/reorder',
  authenticate,
  requirePermission(PERMISSIONS.LESSONS_MANAGE),
  contentCtrl.reorderLessons
);

// --- GOOGLE DRIVE DOCUMENT ROUTES ---
router.post(
  '/documents/upload',
  authenticate,
  requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD),
  upload.single('file'),
  docCtrl.uploadDocument
);
router.get('/documents/:fileAssetId/stream', authenticate, docCtrl.streamProtectedDocument);

// --- EXAM ROUTES ---
router.post(
  '/exams',
  authenticate,
  requireFeature(FEATURE_FLAGS.exams),
  requirePermission(PERMISSIONS.EXAMS_MANAGE),
  examCtrl.createExam
);
router.put(
  '/exams/:examId',
  authenticate,
  requireFeature(FEATURE_FLAGS.exams),
  requirePermission(PERMISSIONS.EXAMS_MANAGE),
  examCtrl.updateExam
);
router.get('/batches/:batchId/exams', authenticate, requireFeature(FEATURE_FLAGS.exams), examCtrl.getBatchExams);
router.get(
  '/exams/:examId',
  authenticate,
  requireFeature(FEATURE_FLAGS.exams),
  requirePermission(PERMISSIONS.EXAMS_MANAGE),
  examCtrl.getExamDetails
);
router.get('/exams/:examId/take', authenticate, requireFeature(FEATURE_FLAGS.exams), examCtrl.getStudentExamQuestions);
router.post('/exams/:examId/submit', authenticate, requireFeature(FEATURE_FLAGS.exams), examCtrl.submitExam);
router.get(
  '/exams/:examId/submissions',
  authenticate,
  requireFeature(FEATURE_FLAGS.exams),
  requirePermission(PERMISSIONS.EXAMS_EVALUATE),
  examCtrl.getExamSubmissions
);
router.put(
  '/exams/attempts/:attemptId/evaluate',
  authenticate,
  requireFeature(FEATURE_FLAGS.exams),
  requirePermission(PERMISSIONS.EXAMS_EVALUATE),
  examCtrl.evaluateStudentAttempt
);
router.get('/exams/:examId/my-result', authenticate, requireFeature(FEATURE_FLAGS.exams), examCtrl.getStudentExamResult);

// --- ASSIGNMENT ROUTES ---
router.post(
  '/assignments',
  authenticate,
  requireFeature(FEATURE_FLAGS.assignments),
  requirePermission(PERMISSIONS.ASSIGNMENTS_MANAGE),
  assignmentCtrl.createAssignment
);
router.get('/batches/:batchId/assignments', authenticate, requireFeature(FEATURE_FLAGS.assignments), assignmentCtrl.getBatchAssignments);
router.get('/assignments/:assignmentId', authenticate, requireFeature(FEATURE_FLAGS.assignments), assignmentCtrl.getAssignmentDetails);
router.put(
  '/assignments/:assignmentId',
  authenticate,
  requireFeature(FEATURE_FLAGS.assignments),
  requirePermission(PERMISSIONS.ASSIGNMENTS_MANAGE),
  assignmentCtrl.updateAssignment
);
router.delete(
  '/assignments/:assignmentId',
  authenticate,
  requireFeature(FEATURE_FLAGS.assignments),
  requirePermission(PERMISSIONS.ASSIGNMENTS_MANAGE),
  assignmentCtrl.deleteAssignment
);
router.post(
  '/assignments/:assignmentId/submit',
  authenticate,
  requireFeature(FEATURE_FLAGS.assignments),
  requirePermission(PERMISSIONS.ASSIGNMENTS_SUBMIT),
  assignmentCtrl.submitAssignment
);
router.get(
  '/assignments/:assignmentId/submissions',
  authenticate,
  requireFeature(FEATURE_FLAGS.assignments),
  requirePermission(PERMISSIONS.ASSIGNMENTS_MANAGE),
  assignmentCtrl.getAssignmentSubmissions
);
router.put(
  '/assignments/submissions/:submissionId/grade',
  authenticate,
  requireFeature(FEATURE_FLAGS.assignments),
  requirePermission(PERMISSIONS.ASSIGNMENTS_MANAGE),
  assignmentCtrl.gradeAssignmentSubmission
);
router.put(
  '/assignments/:assignmentId/grade/:submissionId',
  authenticate,
  requireFeature(FEATURE_FLAGS.assignments),
  requirePermission(PERMISSIONS.ASSIGNMENTS_MANAGE),
  assignmentCtrl.gradeAssignmentSubmission
);

// --- MARKSHEET & ACADEMIC TRANSCRIPT ROUTES ---
router.get('/batches/:batchId/marksheet', authenticate, marksheetCtrl.getBatchMarksheet);

// --- LIVE CLASS & FREE PUBLIC CLASSES ROUTES ---
router.get('/free-classes', requireFeature(FEATURE_FLAGS.freeClasses), liveCtrl.getFreePublicClasses);
router.get('/live-classes', authenticate, requireFeature(FEATURE_FLAGS.liveClasses), liveCtrl.getLiveClasses);
router.get('/live-classes/my', authenticate, requireFeature(FEATURE_FLAGS.liveClasses), liveCtrl.getStudentLiveClasses);
router.post(
  '/live-classes',
  authenticate,
  requireFeature(FEATURE_FLAGS.liveClasses),
  requirePermission(PERMISSIONS.LIVE_CLASSES_MANAGE),
  validateRequest(liveCtrl.createLiveClassSchema),
  liveCtrl.createLiveClass
);
router.put(
  '/live-classes/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.liveClasses),
  requirePermission(PERMISSIONS.LIVE_CLASSES_MANAGE),
  liveCtrl.updateLiveClass
);
router.delete(
  '/live-classes/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.liveClasses),
  requirePermission(PERMISSIONS.LIVE_CLASSES_MANAGE),
  liveCtrl.deleteLiveClass
);

// --- USER & AUDIT MANAGEMENT ROUTES ---
router.get(
  '/users/permissions-catalog',
  authenticate,
  requireFeature(FEATURE_FLAGS.userManagement),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.getPermissionsCatalog
);
router.get(
  '/users',
  authenticate,
  requireFeature(FEATURE_FLAGS.userManagement),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.getUsers
);
router.get(
  '/users/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.userManagement),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.getUserById
);
router.put(
  '/users/:id/role',
  authenticate,
  requireFeature(FEATURE_FLAGS.userManagement),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.updateUserRole
);
router.put(
  '/users/:id/link-students',
  authenticate,
  requireFeature(FEATURE_FLAGS.userManagement),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.linkGuardianStudents
);
router.post(
  '/users/create-staff',
  authenticate,
  requireFeature(FEATURE_FLAGS.userManagement),
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.createStaffAccount
);
router.get('/guardian/overview', authenticate, guardianCtrl.getGuardianOverview);
router.get(
  '/audit-logs',
  authenticate,
  requireFeature(FEATURE_FLAGS.auditLogs),
  requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW),
  userAdminCtrl.getAuditLogs
);

// --- JOB CIRCULAR ROUTES ---
// Public routes
router.get('/jobs', requireFeature(FEATURE_FLAGS.jobs), jobCtrl.getPublicJobPosts);
router.get('/jobs/categories', requireFeature(FEATURE_FLAGS.jobs), jobCtrl.getJobCategories);
router.get('/jobs/:slug', requireFeature(FEATURE_FLAGS.jobs), jobCtrl.getJobPostBySlug);

// Admin routes
router.get(
  '/admin/jobs',
  authenticate,
  requireFeature(FEATURE_FLAGS.jobs),
  requirePermission(PERMISSIONS.JOBS_VIEW),
  jobCtrl.getAdminJobPosts
);
router.post(
  '/admin/jobs',
  authenticate,
  requireFeature(FEATURE_FLAGS.jobs),
  requirePermission(PERMISSIONS.JOBS_MANAGE),
  validateRequest(jobCtrl.jobPostSchema),
  jobCtrl.createJobPost
);
router.put(
  '/admin/jobs/:id',
  authenticate,
  requireFeature(FEATURE_FLAGS.jobs),
  requirePermission(PERMISSIONS.JOBS_MANAGE),
  jobCtrl.updateJobPost
);
router.delete(
  '/admin/jobs/:id',
  authenticate,
  requirePermission(PERMISSIONS.JOBS_MANAGE),
  jobCtrl.deleteJobPost
);

// Admin Job Categories Management
router.post(
  '/admin/jobs/categories',
  authenticate,
  requirePermission(PERMISSIONS.JOBS_MANAGE),
  jobCtrl.createJobCategory
);
router.delete(
  '/admin/jobs/categories/:id',
  authenticate,
  requirePermission(PERMISSIONS.JOBS_MANAGE),
  jobCtrl.deleteJobCategory
);

// --- SYSTEM & SITE SETTINGS ROUTES ---
router.get('/settings', settingCtrl.getSiteSettings);
router.get('/admin/feature-flags', authenticate, requireRole('superadmin'), settingCtrl.getFeatureFlags);
router.put(
  '/admin/settings',
  authenticate,
  requireRole('superadmin'),
  settingCtrl.updateSiteSettings
);
router.put('/admin/feature-flags', authenticate, requireRole('superadmin'), settingCtrl.updateFeatureFlags);

export default router;
