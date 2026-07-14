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
