import express from "express";

// Controllers
import listPeriodHandler from "../controllers/courses/list-period.js";
import listFacultyHandler from "../controllers/courses/list-faculty.js";
import detailHandler from "../controllers/courses/detail.js";
import prerequisitesHandler from "../controllers/courses/prerequisites.js";
import listAvailableHandler from "../controllers/courses/list-available.js";
import rosterHandler from "../controllers/courses/roster.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  listCoursesByPeriodSchema,
  listCoursesByFacultySchema,
  getCourseDetailSchema,
  getCoursePrerequisitesSchema,
  listAvailableCoursesForStudentSchema,
  getCourseRosterSchema,
} from "@shared/schemas/courses.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// List courses by period
router.post(
  "/list/period",
  ensurePermissions(["courses:list"]),
  validateRequestBody(listCoursesByPeriodSchema),
  listPeriodHandler,
);

// List courses by faculty
router.post(
  "/list/faculty",
  ensurePermissions(["courses:list"]),
  validateRequestBody(listCoursesByFacultySchema),
  listFacultyHandler,
);

// Get course detail
router.post(
  "/detail",
  ensurePermissions(["courses:detail"]),
  validateRequestBody(getCourseDetailSchema),
  detailHandler,
);

// Get course prerequisites
router.post(
  "/prerequisites/get",
  ensurePermissions(["courses:detail"]),
  validateRequestBody(getCoursePrerequisitesSchema),
  prerequisitesHandler,
);

// List available courses for student
router.post(
  "/list/available",
  ensurePermissions(["courses:list"]),
  validateRequestBody(listAvailableCoursesForStudentSchema),
  listAvailableHandler,
);

// Get course roster
router.post(
  "/roster/get",
  ensurePermissions(["courses:roster"]),
  validateRequestBody(getCourseRosterSchema),
  rosterHandler,
);

export default router;
