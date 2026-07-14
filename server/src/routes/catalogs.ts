import express from "express";

// Controllers
import listCampusesHandler from "../controllers/catalogs/list-campuses.js";
import listFacultiesHandler from "../controllers/catalogs/list-faculties.js";
import listFacultiesByCampusHandler from "../controllers/catalogs/list-faculties-by-campus.js";
import listRolesHandler from "../controllers/catalogs/list-roles.js";
import listRequestStatusesHandler from "../controllers/catalogs/list-request-statuses.js";
import listEnrollmentStatusesHandler from "../controllers/catalogs/list-enrollment-statuses.js";

// Middleware
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import {
  ensureAuthenticated,
  ensurePermissions,
} from "../middleware/authMiddleware.js";

// Schemas
import {
  listCampusesSchema,
  listFacultiesSchema,
  listFacultiesByCampusSchema,
  listRolesSchema,
  listRequestStatusesSchema,
  listEnrollmentStatusesSchema,
} from "@shared/schemas/catalogs.js";

const router = express.Router();

// Apply global auth middleware
router.use(ensureAuthenticated);

// List campuses catalog
router.post(
  "/campus/list",
  ensurePermissions(["catalogs:list"]),
  validateRequestBody(listCampusesSchema),
  listCampusesHandler,
);

// List faculties catalog
router.post(
  "/faculty/list",
  ensurePermissions(["catalogs:list"]),
  validateRequestBody(listFacultiesSchema),
  listFacultiesHandler,
);

// List faculties by campus
router.post(
  "/faculty/list/campus",
  ensurePermissions(["catalogs:list"]),
  validateRequestBody(listFacultiesByCampusSchema),
  listFacultiesByCampusHandler,
);

// List roles catalog
router.post(
  "/roles/list",
  ensurePermissions(["catalogs:list"]),
  validateRequestBody(listRolesSchema),
  listRolesHandler,
);

// List request statuses catalog
router.post(
  "/request-status/list",
  ensurePermissions(["catalogs:list"]),
  validateRequestBody(listRequestStatusesSchema),
  listRequestStatusesHandler,
);

// List enrollment statuses catalog
router.post(
  "/enrollment-status/list",
  ensurePermissions(["catalogs:list"]),
  validateRequestBody(listEnrollmentStatusesSchema),
  listEnrollmentStatusesHandler,
);

export default router;
