import express from "express";

// CRUD Controllers
import createPeriodHandler from "../controllers/periods/admin/create.js";
import updatePeriodHandler from "../controllers/periods/admin/update.js";
import deletePeriodHandler from "../controllers/periods/admin/delete.js";
import restorePeriodHandler from "../controllers/periods/admin/restore.js";
import listHandler from "../controllers/periods/admin/list.js";
import getPeriodHandler from "../controllers/periods/admin/get.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// CRUD Schemas
import {
  createPeriodSchema,
  updatePeriodSchema,
  deletePeriodSchema,
  restorePeriodSchema,
  listPeriodsSchema,
  getPeriodSchema,
} from "@shared/schemas/period.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

//#region ─── Periods Routes ───

// ─── Admin ───

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

// List periods
router.post(
  "/list",
  ensurePermissions(["period:list"]),
  validateRequestBody(listPeriodsSchema),
  listHandler,
);

//#endregion

export default router;
