import express from "express";

// Controllers
import createHandler from "../controllers/requests/create.js";
import createForStudentHandler from "../controllers/requests/create-for-student.js";
import listMyHandler from "../controllers/requests/list-my.js";
import listHandler from "../controllers/requests/list.js";
import detailHandler from "../controllers/requests/detail.js";
import approveHandler from "../controllers/requests/approve.js";
import rejectHandler from "../controllers/requests/reject.js";
import reviewHandler from "../controllers/requests/review.js";
import resolveHandler from "../controllers/requests/resolve.js";
import assignHandler from "../controllers/requests/assign.js";
import addResponseHandler from "../controllers/requests/add-response.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  createMyRequestSchema,
  createRequestForStudentSchema,
  listMyRequestsSchema,
  listRequestsSchema,
  getRequestDetailSchema,
  approveRequestSchema,
  rejectRequestSchema,
  reviewRequestSchema,
  resolveRequestSchema,
  assignRequestSchema,
  addRequestResponseSchema,
} from "@shared/schemas/requests.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// Create request (self)
router.post(
  "/create",
  ensurePermissions(["requests:create-student"]),
  validateRequestBody(createMyRequestSchema),
  createHandler,
);

// Create request for student (admin/staff)
router.post(
  "/create/student",
  ensurePermissions(["requests:create-student"]),
  validateRequestBody(createRequestForStudentSchema),
  createForStudentHandler,
);

// List my requests
router.post("/list/my", validateRequestBody(listMyRequestsSchema), listMyHandler);

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
  validateRequestBody(getRequestDetailSchema),
  detailHandler,
);

// Approve request
router.post(
  "/approve",
  ensurePermissions(["requests:approve"]),
  validateRequestBody(approveRequestSchema),
  approveHandler,
);

// Reject request
router.post(
  "/reject",
  ensurePermissions(["requests:reject"]),
  validateRequestBody(rejectRequestSchema),
  rejectHandler,
);

// Review request
router.post(
  "/review",
  ensurePermissions(["requests:review"]),
  validateRequestBody(reviewRequestSchema),
  reviewHandler,
);

// Resolve request
router.post(
  "/resolve",
  ensurePermissions(["requests:resolve"]),
  validateRequestBody(resolveRequestSchema),
  resolveHandler,
);

// Assign request
router.post(
  "/assign",
  ensurePermissions(["requests:assign"]),
  validateRequestBody(assignRequestSchema),
  assignHandler,
);

// Add response to request
router.post(
  "/response/add",
  ensurePermissions(["requests:add-response"]),
  validateRequestBody(addRequestResponseSchema),
  addResponseHandler,
);

export default router;
