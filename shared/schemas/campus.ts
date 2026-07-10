import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js"

// Shared fields
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
const createdAtSchema = z.date().refine((date) => date <= new Date(), {
  message: "createdAt-cannot-be-in-future",
});

// Create
const createSchema = z.object({
  name: nameSchema,
  city: citySchema,
  address: addressSchema,
  phone: phoneSchema,
  createdAt: createdAtSchema,
});

// Update (cannot update `isSystemRole`)
const updateSchema = z.object({
  campusId: z.cuid("invalid-campus-id"),
  name: nameSchema.optional(),
  city: citySchema.optional(),
  address: addressSchema.optional(),
  phone: phoneSchema.optional(),
  createdAt: createdAtSchema.optional(),
});

// Delete
const deleteSchema = z.object({
  campusId: z.cuid("invalid-campus-id"),
});

// Restore
const restoreSchema = z.object({
  campusId: z.cuid("invalid-campus-id"),
});

// Get
const getSchema = z.object({
  campusIds: z.array(z.cuid()),
  fields: z
    .array(
      z.enum(
        [
          ...metadataFields,
          "id",
          "name",
          "city",
          "address",
          "phone",
          "createdAt",
        ],
        "invalid-field",
      ),
    )
    .optional(),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
});

// List
const listSchema = z.object({
  count: z.number().min(1, "count-too-low"),
  page: z.number().min(0, "page-too-low"),
  includeDeleted: z.boolean().optional(),
  search: z
    .object({
      query: z.string().min(1, "query-too-short"),
      searchIn: z.array(z.enum(["name", "description"], "invalid-search-field")),
    })
    .optional(),
  fields: z
    .array(
      z.enum(
        [
          ...metadataFields,
          "id",
          "name",
          "city",
          "address",
          "phone",
          "createdAt",
        ],
        "invalid-field",
      ),
    )
    .optional(),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
});

export {
  createSchema,
  updateSchema,
  deleteSchema,
  getSchema,
  restoreSchema,
  listSchema,
};

