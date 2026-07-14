import type { Express } from "express";

// Import routers
import AuthRouter from "./auth.js";
import AccountsRouter from "./accounts.js";
import AccountRolesRouter from "./account-roles.js";
import CampusRouter from "./campuses.js";
import EnrollmentRouter from "./enrollment.js";
import GradesRouter from "./grades.js";
import AcademicHistoryRouter from "./academic-history.js";
import RequestsRouter from "./requests.js";
import CoursesRouter from "./courses.js";
import CourseInstructorRouter from "./course-instructor.js";
import PeriodRouter from "./period.js";
import AccountProfilesRouter from "./account-profiles.js";
import CoordinatorRouter from "./coordinator.js";
import RegistryRouter from "./registry.js";
import CatalogsRouter from "./catalogs.js";

export function registerRoutes(app: Express): void {
  app.use("/api/auth", AuthRouter);
  app.use("/api/accounts", AccountsRouter);
  app.use("/api/account-roles", AccountRolesRouter);
  app.use("/api/campuses", CampusRouter);
  app.use("/api/enrollment", EnrollmentRouter);
  app.use("/api/grades", GradesRouter);
  app.use("/api/academic-history", AcademicHistoryRouter);
  app.use("/api/requests", RequestsRouter);
  app.use("/api/courses", CoursesRouter);
  app.use("/api/course-instructor", CourseInstructorRouter);
  app.use("/api/period", PeriodRouter);
  app.use("/api/account-profiles", AccountProfilesRouter);
  app.use("/api/coordinator", CoordinatorRouter);
  app.use("/api/registry", RegistryRouter);
  app.use("/api/catalogs", CatalogsRouter);
}
