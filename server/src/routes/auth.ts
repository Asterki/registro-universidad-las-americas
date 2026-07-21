import express from "express";

// Controllers
import accountsFetch from "../controllers/auth/fetch.js";
import accountsLogin from "../controllers/auth/login.js";
import accountsLogout from "../controllers/auth/logout.js";

// Middlewares
import { validateRequestBody } from "../middleware/validationMiddleware.js";
import { ensureAuthenticated } from "../middleware/authMiddleware.js";

// Schemas
import { loginAccountSchema } from "@shared/schemas/auth.js";

const router = express.Router();

//#region ─── Auth Routes ───

// ─── Public ───

// Account login
router.post("/login", [validateRequestBody(loginAccountSchema)], accountsLogin);
// ─── Authenticated ───

router.post("/logout", [ensureAuthenticated], accountsLogout);
router.get("/fetch", [ensureAuthenticated], accountsFetch);

//#endregion

export default router;
