import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js";

const nameSchema = z
  .string()
  .min(1, "name-too-short")
  .max(150, "name-too-long");
const codeSchema = z.string().min(1, "code-too-short").max(10, "code-too-long");
const deanSchema = z.string().max(150, "dean-too-long").optional();

const facultyFields = z.enum(
  [...metadataFields, "id", "name", "code", "dean", "campusId"],
  "invalid-field",
);

export const createFacultySchema = z.object({
  campusId: z.cuid("invalid-campus-id"),
  name: nameSchema,
  code: codeSchema,
  dean: deanSchema,
});

export const updateFacultySchema = z.object({
  facultyId: z.cuid("invalid-faculty-id"),
  name: nameSchema.optional(),
  code: codeSchema.optional(),
  dean: deanSchema,
});

export const deleteFacultySchema = z.object({
  facultyId: z.cuid("invalid-faculty-id"),
});

export const restoreFacultySchema = z.object({
  facultyId: z.cuid("invalid-faculty-id"),
});

export const getFacultySchema = z.object({
  facultyIds: z.array(z.cuid()),
  fields: z.array(facultyFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const listFacultiesSchema = z.object({
  count: z.number().min(1, "count-too-low"),
  page: z.number().min(0, "page-too-low"),
  includeDeleted: z.boolean().optional(),
  campusId: z.cuid("invalid-campus-id").optional(),
  search: z
    .object({
      query: z.string().min(1, "query-too-short"),
      searchIn: z.array(z.enum(["name", "code"], "invalid-search-field")),
    })
    .optional(),
  fields: z.array(facultyFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});
