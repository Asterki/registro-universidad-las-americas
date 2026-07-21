import express from "express";

// Controllers
import listRequestsHandler from "../controllers/requests/admin/list.js";
import processRequestHandler from "../controllers/requests/admin/update.js";

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

//#region ─── Registry Routes ───

// ─── Admin / Registry ───

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

//#endregion

export default router;
