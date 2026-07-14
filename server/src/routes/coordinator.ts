import express from "express";

// Controllers
import getScopeHandler from "../controllers/coordinator/get-scope.js";
import listCoursesHandler from "../controllers/coordinator/list-courses.js";
import listStudentsHandler from "../controllers/coordinator/list-students.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  getCoordinatorFacultyScopeSchema,
  listCoordinatorCoursesSchema,
  listCoordinatorStudentsSchema,
} from "@shared/schemas/coordinator.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// Get coordinator faculty scope
router.post(
  "/scope/get",
  ensurePermissions(["coordinator:view-scope"]),
  validateRequestBody(getCoordinatorFacultyScopeSchema),
  getScopeHandler,
);

// List coordinator courses
router.post(
  "/courses/list",
  ensurePermissions(["coordinator:list-courses"]),
  validateRequestBody(listCoordinatorCoursesSchema),
  listCoursesHandler,
);

// List coordinator students
router.post(
  "/students/list",
  ensurePermissions(["coordinator:list-students"]),
  validateRequestBody(listCoordinatorStudentsSchema),
  listStudentsHandler,
);

export default router;
