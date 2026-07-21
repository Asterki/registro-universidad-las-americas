import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js";

const nameSchema = z
  .string()
  .min(1, "name-too-short")
  .max(100, "name-too-long");
const citySchema = z
  .string()
  .min(1, "city-too-short")
  .max(100, "city-too-long");
const addressSchema = z
  .string()
  .min(1, "address-too-short")
  .max(200, "address-too-long");
const phoneSchema = z
  .string()
  .min(1, "phone-too-short")
  .max(20, "phone-too-long");

const campusFields = z.enum(
  [...metadataFields, "id", "name", "city", "address", "phone", "createdAt"],
  "invalid-field",
);

export const listSchema = z.object({
  count: z.number().min(1, "count-too-low"),
  page: z.number().min(0, "page-too-low"),
  includeDeleted: z.boolean().optional(),
  city: z.string().optional(),
  search: z
    .object({
      query: z.string().min(1, "query-too-short").max(100, "query-too-long"),
      searchIn: z.array(z.enum(["name", "city"], "invalid-search-field")),
    })
    .optional(),
  fields: z.array(campusFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const getSchema = z.object({
  campusIds: z.array(z.cuid("invalid-campus-id")),
  fields: z.array(campusFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const createSchema = z.object({
  name: nameSchema,
  city: citySchema,
  address: addressSchema,
  phone: phoneSchema,
});

export const updateSchema = z.object({
  campusId: z.cuid("invalid-campus-id"),
  name: nameSchema.optional(),
  city: citySchema.optional(),
  address: addressSchema.optional(),
  phone: phoneSchema.optional(),
});

export const deleteSchema = z.object({
  campusId: z.cuid("invalid-campus-id"),
});

export const restoreSchema = z.object({
  campusId: z.cuid("invalid-campus-id"),
});
