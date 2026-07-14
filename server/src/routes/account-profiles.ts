import express from "express";

// Controllers
import getMyProfileHandler from "../controllers/account-profiles/get-my-profile.js";
import getStudentProfileHandler from "../controllers/account-profiles/get-student-profile.js";
import getInstructorProfileHandler from "../controllers/account-profiles/get-instructor-profile.js";
import assignInstructorCampusHandler from "../controllers/account-profiles/assign-instructor-campus.js";
import removeInstructorCampusHandler from "../controllers/account-profiles/remove-instructor-campus.js";
import listFacultyStudentsHandler from "../controllers/account-profiles/list-faculty-students.js";
import listFacultyInstructorsHandler from "../controllers/account-profiles/list-faculty-instructors.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  getMyProfileSchema,
  getStudentProfileSchema,
  getInstructorProfileSchema,
  assignInstructorCampusSchema,
  removeInstructorCampusSchema,
  listFacultyStudentsSchema,
  listFacultyInstructorsSchema,
} from "@shared/schemas/account-profiles.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// Get my profile
router.post(
  "/profile/my",
  ensurePermissions(["account-profiles:view-student"]),
  validateRequestBody(getMyProfileSchema),
  getMyProfileHandler,
);

// Get student profile
router.post(
  "/profile/student",
  ensurePermissions(["account-profiles:view-student"]),
  validateRequestBody(getStudentProfileSchema),
  getStudentProfileHandler,
);

// Get instructor profile
router.post(
  "/profile/instructor",
  ensurePermissions(["account-profiles:view-instructor"]),
  validateRequestBody(getInstructorProfileSchema),
  getInstructorProfileHandler,
);

// Assign instructor to campus
router.post(
  "/instructor/campus/assign",
  ensurePermissions(["account-profiles:assign-campus"]),
  validateRequestBody(assignInstructorCampusSchema),
  assignInstructorCampusHandler,
);

// Remove instructor from campus
router.post(
  "/instructor/campus/remove",
  ensurePermissions(["account-profiles:remove-campus"]),
  validateRequestBody(removeInstructorCampusSchema),
  removeInstructorCampusHandler,
);

// List students by faculty
router.post(
  "/list/students/faculty",
  ensurePermissions(["account-profiles:list-faculty"]),
  validateRequestBody(listFacultyStudentsSchema),
  listFacultyStudentsHandler,
);

// List instructors by faculty
router.post(
  "/list/instructors/faculty",
  ensurePermissions(["account-profiles:list-faculty"]),
  validateRequestBody(listFacultyInstructorsSchema),
  listFacultyInstructorsHandler,
);

export default router;
