import express from "express";

// Controllers
import createHandler from "../controllers/faculties/create.js";
import updateHandler from "../controllers/faculties/update.js";
import deleteHandler from "../controllers/faculties/delete.js";
import getHandler from "../controllers/faculties/get.js";
import listHandler from "../controllers/faculties/list.js";
import restoreHandler from "../controllers/faculties/restore.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  getFacultySchema,
  createFacultySchema,
  deleteFacultySchema,
  listFacultiesSchema,
  updateFacultySchema,
  restoreFacultySchema,
} from "@shared/schemas/faculties.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// Create faculty
router.post(
  "/create",
  ensurePermissions(["faculties:create"]),
  validateRequestBody(createFacultySchema),
  createHandler,
);

// Update faculty
router.post(
  "/update",
  ensurePermissions(["faculties:update"]),
  validateRequestBody(updateFacultySchema),
  updateHandler,
);

// Delete faculty
router.post(
  "/delete",
  ensurePermissions(["faculties:delete"]),
  validateRequestBody(deleteFacultySchema),
  deleteHandler,
);

// Restore faculty
router.post(
  "/restore",
  ensurePermissions(["faculties:restore"]),
  validateRequestBody(restoreFacultySchema),
  restoreHandler,
);

// Get faculty(s)
router.post(
  "/get",
  ensurePermissions(["faculties:read"]),
  validateRequestBody(getFacultySchema),
  getHandler,
);

// List faculties
router.post(
  "/list",
  ensurePermissions(["faculties:read"]),
  validateRequestBody(listFacultiesSchema),
  listHandler,
);

export default router;
