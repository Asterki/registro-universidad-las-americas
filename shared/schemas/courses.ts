import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js";

const courseFields = z.enum(
  [
    ...metadataFields,
    "id",
    "code",
    "name",
    "credits",
    "schedule",
    "classroom",
    "maxCapacity",
    "facultyId",
    "periodId",
    "instructors",
  ],
  "invalid-field",
);

export const listCoursesSchema = z.object({
  count: z.number().min(1, "count-too-low"),
  page: z.number().min(0, "page-too-low"),
  includeDeleted: z.boolean().optional(),
  search: z
    .object({
      query: z.string().min(1, "query-too-short"),
      searchIn: z.array(z.enum(["name", "code"], "invalid-search-field")),
    })
    .optional(),
  fields: z.array(courseFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
  filters: z
    .object({
      facultyId: z.cuid("invalid-faculty-id").optional(),
      periodId: z.cuid("invalid-period-id").optional(),
      instructorId: z.cuid("invalid-instructor-id").optional(),
    })
    .optional(),
});

export const getCourseSchema = z.object({
  courseIds: z.array(z.cuid()),
  fields: z.array(courseFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const createCourseSchema = z.object({
  facultyId: z.cuid("invalid-faculty-id"),
  periodId: z.cuid("invalid-period-id"),
  instructorIds: z
    .array(z.cuid("invalid-instructor-id"))
    .min(1, "at-least-one-instructor-required")
    .optional(),
  prerequisitesIds: z.array(z.cuid("invalid-prerequisite-id")).optional(),
  code: z.string().min(1, "code-too-short").max(20, "code-too-long"),
  name: z.string().min(1, "name-too-short").max(150, "name-too-long"),
  credits: z.number().min(1, "credits-too-low").max(30, "credits-too-high"),
  schedule: z.string().max(100, "schedule-too-long").optional(),
  classroom: z.string().max(50, "classroom-too-long").optional(),
  maxCapacity: z
    .number()
    .min(1, "capacity-too-low")
    .max(200, "capacity-too-high")
    .default(30),
});

export const updateCourseSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
  code: z.string().min(1, "code-too-short").max(20, "code-too-long").optional(),
  name: z
    .string()
    .min(1, "name-too-short")
    .max(150, "name-too-long")
    .optional(),
  credits: z
    .number()
    .min(1, "credits-too-low")
    .max(30, "credits-too-high")
    .optional(),
  schedule: z.string().max(100, "schedule-too-long").optional(),
  classroom: z.string().max(50, "classroom-too-long").optional(),
  maxCapacity: z
    .number()
    .min(1, "capacity-too-low")
    .max(200, "capacity-too-high")
    .optional(),
  facultyId: z.cuid("invalid-faculty-id").optional(),
  periodId: z.cuid("invalid-period-id").optional(),
  instructorIds: z
    .array(z.cuid("invalid-instructor-id"))
    .min(1, "at-least-one-instructor-required")
    .optional(),
});

export const deleteCourseSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
});

export const restoreCourseSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
});
