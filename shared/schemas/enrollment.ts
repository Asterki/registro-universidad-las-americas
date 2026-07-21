import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js";

const enrollmentFields = z.enum(
  [
    ...metadataFields,
    "id",
    "accountId",
    "courseId",
    "periodId",
    "registeredAt",
    "status",
    "cancelledAt",
    "cancelledById",
    "finalGrade",
  ],
  "invalid-field",
);

const enrollmentStatus = z.enum(
  ["active", "cancelled", "completed", "failed"],
  "invalid-status",
);

export const listEnrollmentsSchema = z.object({
  count: z
    .number()
    .min(1, "count-too-low")
    .max(100, "count-too-high")
    .optional(),
  page: z.number().min(0, "page-too-low").optional(),
  includeDeleted: z.boolean().optional(),
  accountId: z.cuid("invalid-account-id").optional(),
  courseId: z.cuid("invalid-course-id").optional(),
  periodId: z.cuid("invalid-period-id").optional(),
  status: enrollmentStatus.optional(),
  fields: z.array(enrollmentFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const getEnrollmentSchema = z.object({
  enrollmentIds: z.array(z.cuid("invalid-enrollment-id")),
  fields: z.array(enrollmentFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const createEnrollmentSchema = z.object({
  accountId: z.cuid("invalid-account-id").optional(),
  courseId: z.cuid("invalid-course-id"),
});

export const updateEnrollmentSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
  status: enrollmentStatus.optional(),
  finalGrade: z
    .number()
    .min(0, "grade-too-low")
    .max(100, "grade-too-high")
    .optional(),
});

export const deleteEnrollmentSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
});

export const restoreEnrollmentSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
});
