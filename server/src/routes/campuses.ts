import express from "express";

// Controllers
import createHandler from "../controllers/campuses/admin/create.js";
import updateHandler from "../controllers/campuses/admin/update.js";
import deleteHandler from "../controllers/campuses/admin/delete.js";
import getHandler from "../controllers/campuses/admin/get.js";
import listHandler from "../controllers/campuses/admin/list.js";
import restoreHandler from "../controllers/campuses/admin/restore.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  getSchema,
  createSchema,
  deleteSchema,
  listSchema,
  updateSchema,
  restoreSchema,
} from "@shared/schemas/campus.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

//#region ─── Campuses Routes ───

// ─── Admin ───
// Create campus
router.post(
  "/create",
  ensurePermissions(["campuses:create"]),
  validateRequestBody(createSchema),
  createHandler,
);

// Update campus
router.post(
  "/update",
  ensurePermissions(["campuses:update"]),
  validateRequestBody(updateSchema),
  updateHandler,
);

// Delete campus
router.post(
  "/delete",
  ensurePermissions(["campuses:delete"]),
  validateRequestBody(deleteSchema),
  deleteHandler,
);

// Restore campus
router.post(
  "/restore",
  ensurePermissions(["campuses:restore"]),
  validateRequestBody(restoreSchema),
  restoreHandler,
);

// Get campus(s)
router.post("/get", validateRequestBody(getSchema), getHandler);

// List campus
router.post("/list", validateRequestBody(listSchema), listHandler);

//#endregion

export default router;
