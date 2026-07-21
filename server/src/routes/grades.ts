import express from "express";

// Controllers
import recordHandler from "../controllers/grades/instructor/create.js";
import updateHandler from "../controllers/grades/instructor/update.js";

import deleteHandler from "../controllers/grades/admin/delete.js";
import listCourseHandler from "../controllers/grades/instructor/list-course.js";
import bulkHandler from "../controllers/grades/instructor/bulk.js";
import listFacultyHandler from "../controllers/grades/admin/list-course.js";

import listStudentHandler from "../controllers/grades/admin/list-student.js";
import listMyHandler from "../controllers/grades/student/list-my.js";

import detailHandler from "../controllers/grades/admin/list-course.js";
import publishHandler from "../controllers/grades/admin/publish.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  createGradeSchema,
  updateGradeSchema,
  deleteGradeSchema,
  listGradesSchema,
  getGradeSchema,
} from "@shared/schemas/grades.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

//#region ─── Grades Routes ───

// ─── Instructor ───
// Record grade
router.post(
  "/record",
  ensurePermissions(["grades:record"]),
  validateRequestBody(createGradeSchema),
  recordHandler,
);

// Update grade
router.post(
  "/update",
  ensurePermissions(["grades:update"]),
  validateRequestBody(updateGradeSchema),
  updateHandler,
);

// ─── Admin ───
// Delete grade
router.post(
  "/delete",
  ensurePermissions(["grades:delete"]),
  validateRequestBody(deleteGradeSchema),
  deleteHandler,
);

// ─── Student ───
// List my grades
router.post("/list/my", validateRequestBody(listGradesSchema), listMyHandler);

// ─── Admin ───
// List student grades
router.post(
  "/list/student",
  ensurePermissions(["grades:list-student"]),
  validateRequestBody(listGradesSchema),
  listStudentHandler,
);

// ─── Instructor ───
// List course grades
router.post(
  "/list/course",
  ensurePermissions(["grades:list-course"]),
  validateRequestBody(listGradesSchema),
  listCourseHandler,
);

// ─── Admin ───
// List faculty grades
router.post(
  "/list/faculty",
  ensurePermissions(["grades:list-faculty"]),
  validateRequestBody(listGradesSchema),
  listFacultyHandler,
);

// Get grade detail
router.post(
  "/detail",
  ensurePermissions(["grades:detail"]),
  validateRequestBody(getGradeSchema),
  detailHandler,
);

// Publish final grade
router.post(
  "/final/publish",
  ensurePermissions(["grades:publish-final"]),
  validateRequestBody(createGradeSchema),
  publishHandler,
);

// ─── Instructor ───
// Bulk record grades
router.post(
  "/record/bulk",
  ensurePermissions(["grades:bulk-record"]),
  validateRequestBody(createGradeSchema),
  bulkHandler,
);
//#endregion

export default router;
