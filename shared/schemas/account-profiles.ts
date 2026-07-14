import { z } from "zod";

export const getMyProfileSchema = z.object({});

export const getStudentProfileSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
});

export const getInstructorProfileSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
});

export const assignInstructorCampusSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
  campusId: z.cuid("invalid-campus-id"),
});

export const removeInstructorCampusSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
});

export const listFacultyStudentsSchema = z.object({
  facultyId: z.cuid("invalid-faculty-id"),
  page: z.number().min(0).optional(),
  count: z.number().min(1).max(100).optional(),
});

export const listFacultyInstructorsSchema = z.object({
  facultyId: z.cuid("invalid-faculty-id"),
  page: z.number().min(0).optional(),
  count: z.number().min(1).max(100).optional(),
});
