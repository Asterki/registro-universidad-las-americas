import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js";

const gradeFields = z.enum(
  [
    ...metadataFields,
    "id",
    "enrollmentId",
    "description",
    "score",
    "date",
    "recordedById",
  ],
  "invalid-field",
);

const gradeEntrySchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
  description: z
    .string()
    .min(1, "description-too-short")
    .max(100, "description-too-long"),
  score: z.number().min(0, "score-too-low").max(100, "score-too-high"),
});

export const listGradesSchema = z.object({
  count: z
    .number()
    .min(1, "count-too-low")
    .max(100, "count-too-high")
    .optional(),
  page: z.number().min(0, "page-too-low").optional(),
  includeDeleted: z.boolean().optional(),
  enrollmentId: z.cuid("invalid-enrollment-id").optional(),
  accountId: z.cuid("invalid-account-id").optional(),
  courseId: z.cuid("invalid-course-id").optional(),
  periodId: z.cuid("invalid-period-id").optional(),
  facultyId: z.cuid("invalid-faculty-id").optional(),
  recordedById: z.cuid("invalid-recorded-by-id").optional(),
  fields: z.array(gradeFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const getGradeSchema = z.object({
  gradeIds: z.array(z.cuid("invalid-grade-id")),
  fields: z.array(gradeFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const createGradeSchema = z.union([
  gradeEntrySchema,
  z.object({
    grades: z
      .array(gradeEntrySchema)
      .min(1, "grades-too-few")
      .max(100, "grades-too-many"),
  }),
]);

export const updateGradeSchema = z.object({
  gradeId: z.cuid("invalid-grade-id"),
  description: z
    .string()
    .min(1, "description-too-short")
    .max(100, "description-too-long")
    .optional(),
  score: z
    .number()
    .min(0, "score-too-low")
    .max(100, "score-too-high")
    .optional(),
});

export const deleteGradeSchema = z.object({
  gradeId: z.cuid("invalid-grade-id"),
});

export const restoreGradeSchema = z.object({
  gradeId: z.cuid("invalid-grade-id"),
});
