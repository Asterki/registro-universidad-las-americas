import { z } from "zod";

export const assignInstructorSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
  accountId: z.cuid("invalid-account-id"),
});

export const removeInstructorSchema = z.object({
  courseInstructorId: z.cuid("invalid-course-instructor-id"),
});

export const listCourseInstructorsSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
});

export const listInstructorCoursesSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
});

export const activateInstructorAssignmentSchema = z.object({
  courseInstructorId: z.cuid("invalid-course-instructor-id"),
});

export const deactivateInstructorAssignmentSchema = z.object({
  courseInstructorId: z.cuid("invalid-course-instructor-id"),
});
