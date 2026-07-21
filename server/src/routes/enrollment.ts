import express from "express";

// Admin Controllers
import enrollSelfHandler from "../controllers/enrollments/student/enroll-self.js";
import enrollStudentHandler from "../controllers/enrollments/admin/create.js";
import cancelStudentHandler from "../controllers/enrollments/admin/update.js";
import validateHandler from "../controllers/enrollments/admin/create.js";
import listStudentHandler from "../controllers/enrollments/admin/list.js";
import detailHandler from "../controllers/enrollments/admin/get.js";
import completeHandler from "../controllers/enrollments/admin/update.js";
import failHandler from "../controllers/enrollments/admin/update.js";

// Student Controllers
import listMyHandler from "../controllers/enrollments/student/list-my.js";
import cancelSelfHandler from "../controllers/enrollments/student/cancel-self.js";

// Instructor Controllers
import listCourseHandler from "../controllers/enrollments/instructor/list-course.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  listEnrollmentsSchema,
  getEnrollmentSchema,
} from "@shared/schemas/enrollment.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

//#region ─── Enrollment Routes ───

// ─── Student ───
// Enroll self
router.post(
  "/enroll",
  ensurePermissions(["enrollment:enroll-self"]),
  validateRequestBody(createEnrollmentSchema),
  enrollSelfHandler,
);

// ─── Admin ───
// Enroll student (admin/staff)
router.post(
  "/enroll/student",
  ensurePermissions(["enrollment:enroll-student"]),
  validateRequestBody(createEnrollmentSchema),
  enrollStudentHandler,
);

// ─── Student ───
// Cancel self
router.post(
  "/cancel",
  ensurePermissions(["enrollment:cancel-self"]),
  validateRequestBody(updateEnrollmentSchema),
  cancelSelfHandler,
);

// ─── Admin ───
// Cancel student (admin/staff)
router.post(
  "/cancel/student",
  ensurePermissions(["enrollment:cancel-student"]),
  validateRequestBody(updateEnrollmentSchema),
  cancelStudentHandler,
);

// Validate enrollment
router.post(
  "/validate",
  ensurePermissions(["enrollment:validate"]),
  validateRequestBody(createEnrollmentSchema),
  validateHandler,
);

// ─── Student ───
// List my enrollments
router.post(
  "/list/my",
  validateRequestBody(listEnrollmentsSchema),
  listMyHandler,
);

// ─── Admin ───
// List student enrollments (admin/staff)
router.post(
  "/list/student",
  ensurePermissions(["enrollment:list-student"]),
  validateRequestBody(listEnrollmentsSchema),
  listStudentHandler,
);

// ─── Instructor ───
// List course enrollments
router.post(
  "/list/course",
  ensurePermissions(["enrollment:list-course"]),
  validateRequestBody(listEnrollmentsSchema),
  listCourseHandler,
);

// ─── Admin ───
// Get enrollment detail
router.post(
  "/detail",
  ensurePermissions(["enrollment:detail"]),
  validateRequestBody(getEnrollmentSchema),
  detailHandler,
);

// Complete enrollment
router.post(
  "/complete",
  ensurePermissions(["enrollment:complete"]),
  validateRequestBody(updateEnrollmentSchema),
  completeHandler,
);

// Fail enrollment
router.post(
  "/fail",
  ensurePermissions(["enrollment:fail"]),
  validateRequestBody(updateEnrollmentSchema),
  failHandler,
);
//#endregion

export default router;
