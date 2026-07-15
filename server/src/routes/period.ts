import express from "express";

// Controllers
import listHandler from "../controllers/period/list.js";
import getActiveHandler from "../controllers/period/get-active.js";
import detailHandler from "../controllers/period/detail.js";

// CRUD Controllers
import createPeriodHandler from "../controllers/period/create.js";
import updatePeriodHandler from "../controllers/period/update.js";
import deletePeriodHandler from "../controllers/period/delete.js";
import restorePeriodHandler from "../controllers/period/restore.js";
import listAllPeriodsHandler from "../controllers/period/list.js";
import getPeriodHandler from "../controllers/period/get.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  listPeriodsSchema,
  getActivePeriodSchema,
  getPeriodDetailSchema,
} from "@shared/schemas/period.js";

// CRUD Schemas
import {
  createPeriodSchema,
  updatePeriodSchema,
  deletePeriodSchema,
  restorePeriodSchema,
  listAllPeriodsSchema,
  getPeriodSchema,
} from "@shared/schemas/period.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// --- CRUD Routes ---

// Create period
router.post(
  "/create",
  ensurePermissions(["periods:create"]),
  validateRequestBody(createPeriodSchema),
  createPeriodHandler,
);

// Update period
router.post(
  "/update",
  ensurePermissions(["periods:update"]),
  validateRequestBody(updatePeriodSchema),
  updatePeriodHandler,
);

// Delete period (soft-delete)
router.post(
  "/delete",
  ensurePermissions(["periods:delete"]),
  validateRequestBody(deletePeriodSchema),
  deletePeriodHandler,
);

// Restore period
router.post(
  "/restore",
  ensurePermissions(["periods:restore"]),
  validateRequestBody(restorePeriodSchema),
  restorePeriodHandler,
);

// Get period(s) by ID
router.post(
  "/get",
  ensurePermissions(["period:detail"]),
  validateRequestBody(getPeriodSchema),
  getPeriodHandler,
);

// List all periods (paginated, filterable)
router.post(
  "/list/all",
  ensurePermissions(["period:list"]),
  validateRequestBody(listAllPeriodsSchema),
  listAllPeriodsHandler,
);

// --- Existing Routes ---

// List periods
router.post(
  "/list",
  ensurePermissions(["period:list"]),
  validateRequestBody(listPeriodsSchema),
  listHandler,
);

// Get active period
router.post(
  "/get/active",
  ensurePermissions(["period:detail"]),
  validateRequestBody(getActivePeriodSchema),
  getActiveHandler,
);

// Get period detail
router.post(
  "/detail",
  ensurePermissions(["period:detail"]),
  validateRequestBody(getPeriodDetailSchema),
  detailHandler,
);

export default router;
