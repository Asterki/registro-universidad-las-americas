import express from "express";

// Controllers
import listHandler from "../controllers/period/list.js";
import getActiveHandler from "../controllers/period/get-active.js";
import detailHandler from "../controllers/period/detail.js";

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

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

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
