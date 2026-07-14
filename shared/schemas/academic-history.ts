import { z } from "zod";

export const getMyAcademicHistorySchema = z.object({});

export const getStudentAcademicHistorySchema = z.object({
  accountId: z.cuid("invalid-account-id"),
});

export const getTranscriptSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
});

export const checkPrerequisitesSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
  courseId: z.cuid("invalid-course-id"),
});
