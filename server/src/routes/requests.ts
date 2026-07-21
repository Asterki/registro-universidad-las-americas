import express from "express";

// Controllers
import createHandler from "../controllers/requests/student/create.js";
import createForStudentHandler from "../controllers/requests/student/create.js";
import listMyHandler from "../controllers/requests/student/list-my.js";
import listHandler from "../controllers/requests/admin/list.js";
import detailHandler from "../controllers/requests/admin/get.js";
import approveHandler from "../controllers/requests/admin/update.js";
import rejectHandler from "../controllers/requests/admin/update.js";
import reviewHandler from "../controllers/requests/admin/update.js";
import resolveHandler from "../controllers/requests/admin/update.js";
import assignHandler from "../controllers/requests/admin/update.js";
import addResponseHandler from "../controllers/requests/admin/update.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  listRequestsSchema,
  createRequestSchema,
  deleteRequestSchema,
  getRequestSchema,
  restoreRequestSchema,
  updateRequestSchema,
} from "@shared/schemas/requests.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

//#region ─── Requests Routes ───

// ─── Student ───

// Create request (self)
router.post(
  "/create",
  ensurePermissions(["requests:create-student"]),
  validateRequestBody(createRequestSchema),
  createHandler,
);

// List my requests
router.post(
  "/list/my",
  validateRequestBody(listRequestsSchema),
  listMyHandler,
);

// ─── Admin ───

// Create request for student (admin/staff)
router.post(
  "/create/student",
  ensurePermissions(["requests:create-student"]),
  validateRequestBody(createRequestSchema),
  createForStudentHandler,
);

// List all requests (admin/staff)
router.post(
  "/list",
  ensurePermissions(["requests:list"]),
  validateRequestBody(listRequestsSchema),
  listHandler,
);

// Get request detail
router.post(
  "/detail",
  ensurePermissions(["requests:detail"]),
  validateRequestBody(getRequestSchema),
  detailHandler,
);

// Approve request
router.post(
  "/approve",
  ensurePermissions(["requests:approve"]),
  validateRequestBody(updateRequestSchema),
  approveHandler,
);

// Reject request
router.post(
  "/reject",
  ensurePermissions(["requests:reject"]),
  validateRequestBody(updateRequestSchema),
  rejectHandler,
);

// Review request
router.post(
  "/review",
  ensurePermissions(["requests:review"]),
  validateRequestBody(updateRequestSchema),
  reviewHandler,
);

// Resolve request
router.post(
  "/resolve",
  ensurePermissions(["requests:resolve"]),
  validateRequestBody(updateRequestSchema),
  resolveHandler,
);

// Assign request
router.post(
  "/assign",
  ensurePermissions(["requests:assign"]),
  validateRequestBody(updateRequestSchema),
  assignHandler,
);

// Add response to request
router.post(
  "/response/add",
  ensurePermissions(["requests:add-response"]),
  validateRequestBody(updateRequestSchema),
  addResponseHandler,
);

//#endregion

export default router;
