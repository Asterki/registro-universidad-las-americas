import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js";

const requestFields = z.enum(
  [
    ...metadataFields,
    "id",
    "accountId",
    "facultyId",
    "type",
    "description",
    "date",
    "status",
    "resolvedAt",
    "response",
    "processedById",
  ],
  "invalid-field",
);

const requestStatus = z.enum(
  ["pending", "approved", "rejected", "in_review"],
  "invalid-status",
);

export const listRequestsSchema = z.object({
  page: z.number().min(0, "page-too-low").default(0),
  count: z
    .number()
    .min(1, "count-too-low")
    .max(100, "count-too-high")
    .default(20),
  includeDeleted: z.boolean().optional(),
  status: requestStatus.optional(),
  facultyId: z.cuid("invalid-faculty-id").optional(),
  accountId: z.cuid("invalid-account-id").optional(),
  processedById: z.cuid("invalid-processed-by-id").optional(),
  type: z.string().optional(),
  fields: z.array(requestFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const getRequestSchema = z.object({
  requestIds: z.array(z.cuid("invalid-request-id")),
  fields: z.array(requestFields).optional(),
  populate: z
    .array(z.enum(metadataPopulateFields, "invalid-populate-path"))
    .optional(),
});

export const createRequestSchema = z.object({
  accountId: z.cuid("invalid-account-id").optional(),
  facultyId: z.cuid("invalid-faculty-id"),
  type: z.string().min(1, "type-too-short").max(80, "type-too-long"),
  description: z.string().max(2000, "description-too-long").optional(),
});

export const updateRequestSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
  status: requestStatus.optional(),
  response: z.string().max(2000, "response-too-long").optional(),
  processedById: z.cuid("invalid-processed-by-id").optional(),
});

export const deleteRequestSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
});

export const restoreRequestSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
});
