import express from "express";

// Controllers
import assignHandler from "../controllers/course-instructor/assign.js";
import removeHandler from "../controllers/course-instructor/remove.js";
import listCourseHandler from "../controllers/course-instructor/list-course.js";
import listInstructorHandler from "../controllers/course-instructor/list-instructor.js";
import activateHandler from "../controllers/course-instructor/activate.js";
import deactivateHandler from "../controllers/course-instructor/deactivate.js";

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

// Assign instructor to course
router.post(
  "/assign",
  ensurePermissions(["course-instructor:assign"]),
  validateRequestBody(assignInstructorSchema),
  assignHandler,
);

// Remove instructor from course
router.post(
  "/remove",
  ensurePermissions(["course-instructor:remove"]),
  validateRequestBody(removeInstructorSchema),
  removeHandler,
);

// List instructors by course
router.post(
  "/list/course",
  ensurePermissions(["course-instructor:list"]),
  validateRequestBody(listCourseInstructorsSchema),
  listCourseHandler,
);

// List courses by instructor
router.post(
  "/list/instructor",
  ensurePermissions(["course-instructor:list"]),
  validateRequestBody(listInstructorCoursesSchema),
  listInstructorHandler,
);

// Activate instructor assignment
router.post(
  "/activate",
  ensurePermissions(["course-instructor:activate"]),
  validateRequestBody(activateInstructorAssignmentSchema),
  activateHandler,
);

// Deactivate instructor assignment
router.post(
  "/deactivate",
  ensurePermissions(["course-instructor:deactivate"]),
  validateRequestBody(deactivateInstructorAssignmentSchema),
  deactivateHandler,
);

export default router;
