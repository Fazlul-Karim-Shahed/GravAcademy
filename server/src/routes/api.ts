import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole, requirePermission } from '../middleware/auth';
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

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// --- AUTH ROUTES ---
router.post('/auth/register', validateRequest(authCtrl.registerSchema), authCtrl.register);
router.post('/auth/login', validateRequest(authCtrl.loginSchema), authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);

// --- ACADEMIC CLASS & SUBJECT HIERARCHY ROUTES ---
router.get('/classes', academicClassCtrl.getAcademicClasses);
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
router.get('/batches/schedule/overview', batchCtrl.getScheduleOverview);
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
router.get('/batches/:batchId/exams', authenticate, examCtrl.getBatchExams);
router.get('/exams/:examId/take', authenticate, examCtrl.getStudentExamQuestions);
router.post('/exams/:examId/submit', authenticate, examCtrl.submitExam);

// --- LIVE CLASS ROUTES ---
router.get('/live-classes', authenticate, liveCtrl.getLiveClasses);
router.get('/live-classes/my', authenticate, liveCtrl.getStudentLiveClasses);
router.post(
  '/live-classes',
  authenticate,
  requirePermission(PERMISSIONS.LIVE_CLASSES_MANAGE),
  validateRequest(liveCtrl.createLiveClassSchema),
  liveCtrl.createLiveClass
);

// --- USER & AUDIT MANAGEMENT ROUTES ---
router.get(
  '/users',
  authenticate,
  requirePermission(PERMISSIONS.USERS_MANAGE),
  userAdminCtrl.getUsers
);
router.put(
  '/users/:id/role',
  authenticate,
  requireRole(ROLES.SUPERADMIN),
  userAdminCtrl.updateUserRole
);
router.get(
  '/audit-logs',
  authenticate,
  requireRole(ROLES.SUPERADMIN),
  userAdminCtrl.getAuditLogs
);

export default router;
