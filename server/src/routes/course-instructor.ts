import express from "express";

// Controllers
import assignInstructorHandler from "../controllers/course-instructor/assign.js";
import removeInstructorHandler from "../controllers/course-instructor/remove.js";
import listCourseInstructorsHandler from "../controllers/course-instructor/list-course.js";
import listInstructorCoursesHandler from "../controllers/course-instructor/list-instructor.js";
import activateInstructorAssignmentHandler from "../controllers/course-instructor/activate.js";
import deactivateInstructorAssignmentHandler from "../controllers/course-instructor/deactivate.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  assignInstructorSchema,
  removeInstructorSchema,
  listCourseInstructorsSchema,
  listInstructorCoursesSchema,
  activateInstructorAssignmentSchema,
  deactivateInstructorAssignmentSchema,
} from "@shared/schemas/course-instructor.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

//#region ─── Course-Instructor Routes ───

// Assign instructor to course
router.post(
  "/assign",
  ensurePermissions(["course-instructor:assign"]),
  validateRequestBody(assignInstructorSchema),
  assignInstructorHandler,
);

// Remove instructor from course
router.post(
  "/remove",
  ensurePermissions(["course-instructor:remove"]),
  validateRequestBody(removeInstructorSchema),
  removeInstructorHandler,
);

// List instructors by course
router.post(
  "/list/course",
  ensurePermissions(["course-instructor:list"]),
  validateRequestBody(listCourseInstructorsSchema),
  listCourseInstructorsHandler,
);

// List courses by instructor
router.post(
  "/list/instructor",
  ensurePermissions(["course-instructor:list"]),
  validateRequestBody(listInstructorCoursesSchema),
  listInstructorCoursesHandler,
);

// Activate instructor assignment
router.post(
  "/activate",
  ensurePermissions(["course-instructor:activate"]),
  validateRequestBody(activateInstructorAssignmentSchema),
  activateInstructorAssignmentHandler,
);

// Deactivate instructor assignment
router.post(
  "/deactivate",
  ensurePermissions(["course-instructor:deactivate"]),
  validateRequestBody(deactivateInstructorAssignmentSchema),
  deactivateInstructorAssignmentHandler,
);

//#endregion

export default router;
