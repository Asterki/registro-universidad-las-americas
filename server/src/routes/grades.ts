import express from "express";

// Controllers
import recordHandler from "../controllers/grades/record.js";
import updateHandler from "../controllers/grades/update.js";
import deleteHandler from "../controllers/grades/delete.js";
import listMyHandler from "../controllers/grades/list-my.js";
import listStudentHandler from "../controllers/grades/list-student.js";
import listCourseHandler from "../controllers/grades/list-course.js";
import listFacultyHandler from "../controllers/grades/list-faculty.js";
import detailHandler from "../controllers/grades/detail.js";
import publishHandler from "../controllers/grades/publish.js";
import bulkHandler from "../controllers/grades/bulk.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  recordGradeSchema,
  updateGradeSchema,
  deleteGradeSchema,
  listMyGradesSchema,
  listStudentGradesSchema,
  listCourseGradesSchema,
  listFacultyGradesSchema,
  getGradeDetailSchema,
  publishFinalGradeSchema,
  bulkRecordGradesSchema,
} from "@shared/schemas/grades.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// Record grade
router.post(
  "/record",
  ensurePermissions(["grades:record"]),
  validateRequestBody(recordGradeSchema),
  recordHandler,
);

// Update grade
router.post(
  "/update",
  ensurePermissions(["grades:update"]),
  validateRequestBody(updateGradeSchema),
  updateHandler,
);

// Delete grade
router.post(
  "/delete",
  ensurePermissions(["grades:delete"]),
  validateRequestBody(deleteGradeSchema),
  deleteHandler,
);

// List my grades
router.post(
  "/list/my",
  validateRequestBody(listMyGradesSchema),
  listMyHandler,
);

// List student grades
router.post(
  "/list/student",
  ensurePermissions(["grades:list-student"]),
  validateRequestBody(listStudentGradesSchema),
  listStudentHandler,
);

// List course grades
router.post(
  "/list/course",
  ensurePermissions(["grades:list-course"]),
  validateRequestBody(listCourseGradesSchema),
  listCourseHandler,
);

// List faculty grades
router.post(
  "/list/faculty",
  ensurePermissions(["grades:list-faculty"]),
  validateRequestBody(listFacultyGradesSchema),
  listFacultyHandler,
);

// Get grade detail
router.post(
  "/detail",
  ensurePermissions(["grades:detail"]),
  validateRequestBody(getGradeDetailSchema),
  detailHandler,
);

// Publish final grade
router.post(
  "/final/publish",
  ensurePermissions(["grades:publish-final"]),
  validateRequestBody(publishFinalGradeSchema),
  publishHandler,
);

// Bulk record grades
router.post(
  "/record/bulk",
  ensurePermissions(["grades:bulk-record"]),
  validateRequestBody(bulkRecordGradesSchema),
  bulkHandler,
);

export default router;
