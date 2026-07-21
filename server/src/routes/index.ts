import type { Express } from "express";

// Import routers
import AuthRouter from "./auth.js";
import AccountsRouter from "./accounts.js";
import AccountRolesRouter from "./account-roles.js";
import CampusRouter from "./campuses.js";
import EnrollmentRouter from "./enrollment.js";
import GradesRouter from "./grades.js";
import RequestsRouter from "./requests.js";
import CoursesRouter from "./courses.js";
import PeriodsRouter from "./periods.js";
import AccountProfilesRouter from "./account-profiles.js";
import RegistryRouter from "./registry.js";
import FacultiesRouter from "./faculties.js";
import CourseInstructorRouter from "./course-instructor.js";

export function registerRoutes(app: Express): void {
  app.use("/api/auth", AuthRouter);
  app.use("/api/accounts", AccountsRouter);
  app.use("/api/account-roles", AccountRolesRouter);
  app.use("/api/campuses", CampusRouter);
  // app.use("/api/enrollment", EnrollmentRouter);
  // app.use("/api/grades", GradesRouter);
  // app.use("/api/requests", RequestsRouter);
  app.use("/api/courses", CoursesRouter);
  app.use("/api/course-instructor", CourseInstructorRouter);
  app.use("/api/periods", PeriodsRouter);
  app.use("/api/account-profiles", AccountProfilesRouter);
  app.use("/api/registry", RegistryRouter);
  app.use("/api/faculties", FacultiesRouter);
}
