import express from "express";

// Controllers
import getMyHandler from "../controllers/academic-history/get-my.js";
import getStudentHandler from "../controllers/academic-history/get-student.js";
import transcriptHandler from "../controllers/academic-history/transcript.js";
import checkPrerequisitesHandler from "../controllers/academic-history/check-prerequisites.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  getMyAcademicHistorySchema,
  getStudentAcademicHistorySchema,
  getTranscriptSchema,
  checkPrerequisitesSchema,
} from "@shared/schemas/academic-history.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// Get my academic history
router.post(
  "/get/my",
  validateRequestBody(getMyAcademicHistorySchema),
  getMyHandler,
);

// Get student academic history
router.post(
  "/get/student",
  ensurePermissions(["academic-history:get-student"]),
  validateRequestBody(getStudentAcademicHistorySchema),
  getStudentHandler,
);

// Get transcript
router.post(
  "/transcript",
  ensurePermissions(["academic-history:transcript"]),
  validateRequestBody(getTranscriptSchema),
  transcriptHandler,
);

// Check prerequisites
router.post(
  "/check/prerequisites",
  ensurePermissions(["academic-history:check-prerequisites"]),
  validateRequestBody(checkPrerequisitesSchema),
  checkPrerequisitesHandler,
);

export default router;
