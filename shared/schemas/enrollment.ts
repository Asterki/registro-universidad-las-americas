import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js";

export const enrollSelfSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
});

export const enrollStudentSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
  courseId: z.cuid("invalid-course-id"),
});

export const cancelSelfSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
});

export const cancelStudentSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
});

export const validateEnrollmentSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
  courseId: z.cuid("invalid-course-id"),
});

export const listMyEnrollmentsSchema = z.object({
  periodId: z.cuid("invalid-period-id").optional(),
  includeCancelled: z.boolean().optional(),
  status: z.enum(["active", "cancelled", "completed", "failed"]).optional(),
  page: z.number().min(0).optional(),
  count: z.number().min(1).max(100).optional(),
});

export const listStudentEnrollmentsSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
  periodId: z.cuid("invalid-period-id").optional(),
  includeCancelled: z.boolean().optional(),
  status: z.enum(["active", "cancelled", "completed", "failed"]).optional(),
  page: z.number().min(0).optional(),
  count: z.number().min(1).max(100).optional(),
});

export const listCourseEnrollmentsSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
  status: z.enum(["active", "cancelled", "completed", "failed"]).optional(),
  accountId: z.cuid("invalid-account-id").optional(),
  page: z.number().min(0).optional(),
  count: z.number().min(1).max(100).optional(),
});

export const getEnrollmentDetailSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
});

export const completeEnrollmentSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
});

export const failEnrollmentSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
});
