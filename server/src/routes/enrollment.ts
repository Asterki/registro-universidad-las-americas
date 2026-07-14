import express from "express";

// Controllers
import enrollSelfHandler from "../controllers/enrollment/enroll-self.js";
import enrollStudentHandler from "../controllers/enrollment/enroll-student.js";
import cancelSelfHandler from "../controllers/enrollment/cancel-self.js";
import cancelStudentHandler from "../controllers/enrollment/cancel-student.js";
import validateHandler from "../controllers/enrollment/validate.js";
import listMyHandler from "../controllers/enrollment/list-my.js";
import listStudentHandler from "../controllers/enrollment/list-student.js";
import listCourseHandler from "../controllers/enrollment/list-course.js";
import detailHandler from "../controllers/enrollment/detail.js";
import completeHandler from "../controllers/enrollment/complete.js";
import failHandler from "../controllers/enrollment/fail.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  enrollSelfSchema,
  enrollStudentSchema,
  cancelSelfSchema,
  cancelStudentSchema,
  validateEnrollmentSchema,
  listMyEnrollmentsSchema,
  listStudentEnrollmentsSchema,
  listCourseEnrollmentsSchema,
  getEnrollmentDetailSchema,
  completeEnrollmentSchema,
  failEnrollmentSchema,
} from "@shared/schemas/enrollment.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// Enroll self
router.post(
  "/enroll",
  ensurePermissions(["enrollment:enroll-self"]),
  validateRequestBody(enrollSelfSchema),
  enrollSelfHandler,
);

// Enroll student (admin/staff)
router.post(
  "/enroll/student",
  ensurePermissions(["enrollment:enroll-student"]),
  validateRequestBody(enrollStudentSchema),
  enrollStudentHandler,
);

// Cancel self
router.post(
  "/cancel",
  ensurePermissions(["enrollment:cancel-self"]),
  validateRequestBody(cancelSelfSchema),
  cancelSelfHandler,
);

// Cancel student (admin/staff)
router.post(
  "/cancel/student",
  ensurePermissions(["enrollment:cancel-student"]),
  validateRequestBody(cancelStudentSchema),
  cancelStudentHandler,
);

// Validate enrollment
router.post(
  "/validate",
  ensurePermissions(["enrollment:validate"]),
  validateRequestBody(validateEnrollmentSchema),
  validateHandler,
);

// List my enrollments
router.post(
  "/list/my",
  validateRequestBody(listMyEnrollmentsSchema),
  listMyHandler,
);

// List student enrollments (admin/staff)
router.post(
  "/list/student",
  ensurePermissions(["enrollment:list-student"]),
  validateRequestBody(listStudentEnrollmentsSchema),
  listStudentHandler,
);

// List course enrollments
router.post(
  "/list/course",
  ensurePermissions(["enrollment:list-course"]),
  validateRequestBody(listCourseEnrollmentsSchema),
  listCourseHandler,
);

// Get enrollment detail
router.post(
  "/detail",
  ensurePermissions(["enrollment:detail"]),
  validateRequestBody(getEnrollmentDetailSchema),
  detailHandler,
);

// Complete enrollment
router.post(
  "/complete",
  ensurePermissions(["enrollment:complete"]),
  validateRequestBody(completeEnrollmentSchema),
  completeHandler,
);

// Fail enrollment
router.post(
  "/fail",
  ensurePermissions(["enrollment:fail"]),
  validateRequestBody(failEnrollmentSchema),
  failHandler,
);

export default router;
