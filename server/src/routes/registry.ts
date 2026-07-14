import express from "express";

// Controllers
import listRequestsHandler from "../controllers/registry/list-requests.js";
import processRequestHandler from "../controllers/registry/process-request.js";
import listInstructorsHandler from "../controllers/registry/list-instructors.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  listAllAcademicRequestsSchema,
  processAcademicRequestSchema,
  listAllInstructorsSchema,
} from "@shared/schemas/registry.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// List all academic requests
router.post(
  "/requests/list",
  ensurePermissions(["registry:list-requests"]),
  validateRequestBody(listAllAcademicRequestsSchema),
  listRequestsHandler,
);

// Process academic request
router.post(
  "/requests/process",
  ensurePermissions(["registry:process-requests"]),
  validateRequestBody(processAcademicRequestSchema),
  processRequestHandler,
);

// List all instructors
router.post(
  "/instructors/list",
  ensurePermissions(["registry:list-instructors"]),
  validateRequestBody(listAllInstructorsSchema),
  listInstructorsHandler,
);

export default router;
