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
router.get('/classes', academicClassCtrl.getAcademicClasses);
router.get('/classes/:idOrSlug', academicClassCtrl.getClassByIdOrSlug);
router.post(
  '/classes',
  authenticate,
  requirePermission(PERMISSIONS.COURSES_CREATE),
  validateRequest(academicClassCtrl.createClassSchema),
  academicClassCtrl.createAcademicClass
);
router.put(
  '/classes/:id',
  authenticate,
  requirePermission(PERMISSIONS.COURSES_UPDATE),
  validateRequest(academicClassCtrl.updateClassSchema),
  academicClassCtrl.updateAcademicClass
);
router.delete(
  '/classes/:id',
  authenticate,
  requirePermission(PERMISSIONS.COURSES_DELETE),
  academicClassCtrl.deleteAcademicClass
);

// --- COURSE ROUTES ---
router.get('/courses', courseCtrl.getCourses);
router.get('/courses/:id', courseCtrl.getCourseById);
router.post(
  '/courses',
  authenticate,
  requirePermission(PERMISSIONS.COURSES_CREATE),
  validateRequest(courseCtrl.createCourseSchema),
  courseCtrl.createCourse
);
router.put(
  '/courses/:id',
  authenticate,
  requirePermission(PERMISSIONS.COURSES_UPDATE),
  courseCtrl.updateCourse
);
router.delete(
  '/courses/:id',
  authenticate,
  requirePermission(PERMISSIONS.COURSES_DELETE),
  courseCtrl.deleteCourse
);

// --- BATCH ROUTES (Including Copy-from-batch workflow & Weekly Schedule System) ---
router.get('/batches', batchCtrl.getBatches);
router.get('/batches/schedule/overview', optionalAuthenticate, batchCtrl.getScheduleOverview);
router.get('/batches/:id', batchCtrl.getBatchById);
router.get('/batches/:batchId/hierarchy', batchCtrl.getBatchHierarchy);
router.post(
  '/batches',
  authenticate,
  requirePermission(PERMISSIONS.BATCHES_MANAGE),
  validateRequest(batchCtrl.createBatchSchema),
  batchCtrl.createBatch
);
router.put(
  '/batches/:id',
  authenticate,
  requirePermission(PERMISSIONS.BATCHES_MANAGE),
  batchCtrl.updateBatch
);
router.delete(
  '/batches/:id',
  authenticate,
  requirePermission(PERMISSIONS.BATCHES_MANAGE),
  batchCtrl.deleteBatch
);

// --- ENROLLMENT ROUTES ---
router.post(
  '/enrollments/enroll',
  authenticate,
  validateRequest(enrollmentCtrl.enrollBatchSchema),
  enrollmentCtrl.enrollInBatch
);
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
// Admin Admission & Enrollment Routes
router.post(
  '/enrollments/admin-admit',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  validateRequest(enrollmentCtrl.adminAdmitStudentSchema),
  enrollmentCtrl.adminAdmitStudent
);
router.get(
  '/enrollments/admin-list',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  enrollmentCtrl.getAdminEnrollments
);
router.delete(
  '/enrollments/:enrollmentId',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  enrollmentCtrl.removeStudentFromBatch
);
router.post(
  '/enrollments/cancel',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  enrollmentCtrl.removeStudentFromBatch
);

// --- FINANCE & PAYMENT ROUTES ---
router.post(
  '/finance/collect-payment',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  validateRequest(financeCtrl.collectPaymentSchema),
  financeCtrl.collectPayment
);
router.get(
  '/finance/admin-payments',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  financeCtrl.getAdminPayments
);
router.get(
  '/finance/my-payments',
  authenticate,
  financeCtrl.getMyPayments
);
router.get(
  '/finance/receipts/:id',
  authenticate,
  financeCtrl.getPaymentReceipt
);
router.post(
  '/finance/upload-document',
  authenticate,
  upload.single('document'),
  financeCtrl.uploadPaymentDocument
);
router.delete(
  '/finance/payments/:id',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  financeCtrl.deletePayment
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
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TEACHER),
  examCtrl.createExam
);
router.get('/batches/:batchId/exams', authenticate, examCtrl.getBatchExams);
router.get('/exams/:examId', authenticate, examCtrl.getExamDetails);
router.get('/exams/:examId/take', authenticate, examCtrl.getStudentExamQuestions);
router.post('/exams/:examId/submit', authenticate, examCtrl.submitExam);
router.get(
  '/exams/:examId/submissions',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TEACHER),
  examCtrl.getExamSubmissions
);
router.put(
  '/exams/attempts/:attemptId/evaluate',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TEACHER),
  examCtrl.evaluateStudentAttempt
);
router.get('/exams/:examId/my-result', authenticate, examCtrl.getStudentExamResult);

// --- LIVE CLASS & FREE PUBLIC CLASSES ROUTES ---
router.get('/free-classes', liveCtrl.getFreePublicClasses);
router.get('/live-classes', authenticate, liveCtrl.getLiveClasses);
router.get('/live-classes/my', authenticate, liveCtrl.getStudentLiveClasses);
router.post(
  '/live-classes',
  authenticate,
  requirePermission(PERMISSIONS.LIVE_CLASSES_MANAGE),
  validateRequest(liveCtrl.createLiveClassSchema),
  liveCtrl.createLiveClass
);
router.put(
  '/live-classes/:id',
  authenticate,
  requirePermission(PERMISSIONS.LIVE_CLASSES_MANAGE),
  liveCtrl.updateLiveClass
);
router.delete(
  '/live-classes/:id',
  authenticate,
  requirePermission(PERMISSIONS.LIVE_CLASSES_MANAGE),
  liveCtrl.deleteLiveClass
);

// --- USER & AUDIT MANAGEMENT ROUTES ---
router.get(
  '/users/permissions-catalog',
  authenticate,
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.getPermissionsCatalog
);
router.get(
  '/users',
  authenticate,
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.getUsers
);
router.get(
  '/users/:id',
  authenticate,
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.getUserById
);
router.put(
  '/users/:id/role',
  authenticate,
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.updateUserRole
);
router.get(
  '/audit-logs',
  authenticate,
  requireRole(ROLES.SUPERADMIN),
  userAdminCtrl.getAuditLogs
);

// --- JOB CIRCULAR ROUTES ---
// Public routes
router.get('/jobs', jobCtrl.getPublicJobPosts);
router.get('/jobs/categories', jobCtrl.getJobCategories);
router.get('/jobs/:slug', jobCtrl.getJobPostBySlug);

// Admin routes
router.get(
  '/admin/jobs',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  jobCtrl.getAdminJobPosts
);
router.post(
  '/admin/jobs',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  validateRequest(jobCtrl.jobPostSchema),
  jobCtrl.createJobPost
);
router.put(
  '/admin/jobs/:id',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  jobCtrl.updateJobPost
);
router.delete(
  '/admin/jobs/:id',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  jobCtrl.deleteJobPost
);

// Admin Job Categories Management
router.post(
  '/admin/jobs/categories',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  jobCtrl.createJobCategory
);
router.delete(
  '/admin/jobs/categories/:id',
  authenticate,
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  jobCtrl.deleteJobCategory
);

export default router;
