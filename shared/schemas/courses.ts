import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js";

export const listCoursesByPeriodSchema = z.object({
  periodId: z.cuid("invalid-period-id"),
  fields: z.array(z.enum([...metadataFields, "id", "code", "name", "credits", "schedule", "classroom", "maxCapacity", "facultyId", "periodId"], "invalid-field")).optional(),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
});

export const listCoursesByFacultySchema = z.object({
  facultyId: z.cuid("invalid-faculty-id"),
  periodId: z.cuid("invalid-period-id").optional(),
  fields: z.array(z.enum([...metadataFields, "id", "code", "name", "credits", "schedule", "classroom", "maxCapacity"], "invalid-field")).optional(),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
});

export const getCourseDetailSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
});

export const getCoursePrerequisitesSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
});

export const listAvailableCoursesForStudentSchema = z.object({
  periodId: z.cuid("invalid-period-id"),
});

export const getCourseRosterSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
});

//#region Course CRUD
export const createCourseSchema = z.object({
  facultyId: z.cuid("invalid-faculty-id"),
  periodId: z.cuid("invalid-period-id"),
  code: z.string().min(1, "code-too-short").max(20, "code-too-long"),
  name: z.string().min(1, "name-too-short").max(150, "name-too-long"),
  credits: z.number().min(1, "credits-too-low").max(30, "credits-too-high"),
  schedule: z.string().max(100, "schedule-too-long").optional(),
  classroom: z.string().max(50, "classroom-too-long").optional(),
  maxCapacity: z.number().min(1, "capacity-too-low").max(200, "capacity-too-high").default(30),
});

export const updateCourseSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
  code: z.string().min(1, "code-too-short").max(20, "code-too-long").optional(),
  name: z.string().min(1, "name-too-short").max(150, "name-too-long").optional(),
  credits: z.number().min(1, "credits-too-low").max(30, "credits-too-high").optional(),
  schedule: z.string().max(100, "schedule-too-long").optional(),
  classroom: z.string().max(50, "classroom-too-long").optional(),
  maxCapacity: z.number().min(1, "capacity-too-low").max(200, "capacity-too-high").optional(),
  facultyId: z.cuid("invalid-faculty-id").optional(),
  periodId: z.cuid("invalid-period-id").optional(),
});

export const deleteCourseSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
});

export const restoreCourseSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
});

const courseFields = z.enum(
  [...metadataFields, "id", "code", "name", "credits", "schedule", "classroom", "maxCapacity", "facultyId", "periodId"],
  "invalid-field",
);

export const listCoursesSchema = z.object({
  count: z.number().min(1, "count-too-low"),
  page: z.number().min(0, "page-too-low"),
  includeDeleted: z.boolean().optional(),
  facultyId: z.cuid("invalid-faculty-id").optional(),
  periodId: z.cuid("invalid-period-id").optional(),
  search: z.object({
    query: z.string().min(1, "query-too-short"),
    searchIn: z.array(z.enum(["name", "code"], "invalid-search-field")),
  }).optional(),
  fields: z.array(courseFields).optional(),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
});

export const getCourseSchema = z.object({
  courseIds: z.array(z.cuid()),
  fields: z.array(courseFields).optional(),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
});
//#endregion
