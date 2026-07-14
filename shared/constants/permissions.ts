import type { Permission } from "../types/permissions.js";

const permissions: Permission[] = [
  "*",
  "*:*",

  // Reports
  "reports:read",
  "reports:export",
  "reports:print",

  // Accounts
  "accounts:create",
  "accounts:read",
  "accounts:update",
  "accounts:delete",
  "accounts:restore",
  "accounts:change-password",
  "accounts:update-status",

  // Account Roles
  "account-roles:create",
  "account-roles:read",
  "account-roles:update",
  "account-roles:delete",
  "account-roles:restore",

  // config
  "config:update",
  "config:read",
  "config:export",
  "config:import",

  // Profile
  "profile:update",

  // Campuses
  "campuses:create",
  "campuses:read",
  "campuses:update",
  "campuses:delete",
  "campuses:restore",

  // Logs
  "logs:read",
  "logs:export",

  // Enrollment
  "enrollment:enroll-self",
  "enrollment:enroll-student",
  "enrollment:cancel-self",
  "enrollment:cancel-student",
  "enrollment:validate",
  "enrollment:list-student",
  "enrollment:list-course",
  "enrollment:detail",
  "enrollment:complete",
  "enrollment:fail",

  // Grades
  "grades:record",
  "grades:update",
  "grades:delete",
  "grades:list-student",
  "grades:list-course",
  "grades:list-faculty",
  "grades:detail",
  "grades:publish-final",
  "grades:bulk-record",

  // Academic History
  "academic-history:get-student",
  "academic-history:transcript",
  "academic-history:check-prerequisites",

  // Requests
  "requests:create-student",
  "requests:list",
  "requests:detail",
  "requests:approve",
  "requests:reject",
  "requests:review",
  "requests:resolve",
  "requests:assign",
  "requests:add-response",

  // Courses
  "courses:list",
  "courses:detail",
  "courses:prerequisites",
  "courses:roster",

  // Course Instructor
  "course-instructor:assign",
  "course-instructor:remove",
  "course-instructor:list",
  "course-instructor:activate",
  "course-instructor:deactivate",

  // Periods
  "period:list",
  "period:detail",

  // Account Profiles
  "account-profiles:view-student",
  "account-profiles:view-instructor",
  "account-profiles:assign-campus",
  "account-profiles:remove-campus",
  "account-profiles:list-faculty",

  // Coordinator
  "coordinator:view-scope",
  "coordinator:list-courses",
  "coordinator:list-students",

  // Registry
  "registry:list-requests",
  "registry:process-requests",
  "registry:list-instructors",

  // Catalogs
  "catalogs:list",
];

export default permissions;
