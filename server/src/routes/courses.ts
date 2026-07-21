import express from "express";

// CRUD Controllers
import createCourseHandler from "../controllers/courses/create.js";
import updateCourseHandler from "../controllers/courses/update.js";
import deleteCourseHandler from "../controllers/courses/delete.js";
import restoreCourseHandler from "../controllers/courses/restore.js";
import listCoursesHandler from "../controllers/courses/list.js";
import getCourseHandler from "../controllers/courses/get.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// CRUD Schemas
import {
  createCourseSchema,
  updateCourseSchema,
  deleteCourseSchema,
  restoreCourseSchema,
  listCoursesSchema,
  getCourseSchema,
} from "@shared/schemas/courses.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

//#region ─── Courses Routes ───

// ─── Admin ───
// Create course
router.post(
  "/create",
  ensurePermissions(["courses:create"]),
  validateRequestBody(createCourseSchema),
  createCourseHandler,
);

// Update course
router.post(
  "/update",
  ensurePermissions(["courses:update"]),
  validateRequestBody(updateCourseSchema),
  updateCourseHandler,
);

// Delete course (soft-delete)
router.post(
  "/delete",
  ensurePermissions(["courses:delete"]),
  validateRequestBody(deleteCourseSchema),
  deleteCourseHandler,
);

// Restore course
router.post(
  "/restore",
  ensurePermissions(["courses:restore"]),
  validateRequestBody(restoreCourseSchema),
  restoreCourseHandler,
);

// Get course(s) by ID
router.post(
  "/get",
  ensurePermissions(["courses:detail"]),
  validateRequestBody(getCourseSchema),
  getCourseHandler,
);

// List courses (paginated, filterable)
router.post(
  "/list",
  ensurePermissions(["courses:list"]),
  validateRequestBody(listCoursesSchema),
  listCoursesHandler,
);
//#endregion

export default router;
