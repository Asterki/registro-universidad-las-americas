import express from "express";

// Controllers
import createHandler from "../controllers/campuses/create.js";
import updateHandler from "../controllers/campuses/update.js";
import deleteHandler from "../controllers/campuses/delete.js";
import getHandler from "../controllers/campuses/get.js";
import listHandler from "../controllers/campuses/list.js";
import restoreHandler from "../controllers/campuses/restore.js";

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

// Create role
router.post(
  "/create",
  ensurePermissions(["campuses:create"]),
  validateRequestBody(createSchema),
  createHandler,
);

// Update role
router.post(
  "/update",
  ensurePermissions(["campuses:update"]),
  validateRequestBody(updateSchema),
  updateHandler,
);

// Delete role
router.post(
  "/delete",
  ensurePermissions(["campuses:delete"]),
  validateRequestBody(deleteSchema),
  deleteHandler,
);

// Restore role
router.post(
  "/restore",
  ensurePermissions(["campuses:restore"]),
  validateRequestBody(restoreSchema),
  restoreHandler,
);

// Get role(s)
router.post("/get", validateRequestBody(getSchema), getHandler);

// List roles
router.post("/list", validateRequestBody(listSchema), listHandler);

export default router;

