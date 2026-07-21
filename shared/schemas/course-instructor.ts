import { z } from "zod";

export const assignInstructorSchema = z.object({
  courseId: z.string().min(1, "course-id-required"),
  accountId: z.string().min(1, "account-id-required"),
});

export const removeInstructorSchema = z.object({
  courseId: z.string().min(1, "course-id-required"),
  accountId: z.string().min(1, "account-id-required"),
});

export const listCourseInstructorsSchema = z.object({
  courseId: z.string().min(1, "course-id-required"),
});

export const listInstructorCoursesSchema = z.object({
  accountId: z.string().min(1, "account-id-required"),
});

export const activateInstructorAssignmentSchema = z.object({
  courseId: z.string().min(1, "course-id-required"),
  accountId: z.string().min(1, "account-id-required"),
});

export const deactivateInstructorAssignmentSchema = z.object({
  courseId: z.string().min(1, "course-id-required"),
  accountId: z.string().min(1, "account-id-required"),
});
