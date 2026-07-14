import { z } from "zod";

export const createMyRequestSchema = z.object({
  type: z.string().min(1, "type-too-short").max(80, "type-too-long"),
  description: z.string().max(2000, "description-too-long").optional(),
  facultyId: z.cuid("invalid-faculty-id"),
});

export const createRequestForStudentSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
  type: z.string().min(1, "type-too-short").max(80, "type-too-long"),
  description: z.string().max(2000, "description-too-long").optional(),
  facultyId: z.cuid("invalid-faculty-id"),
});

export const listMyRequestsSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "in_review"]).optional(),
  page: z.number().min(0).default(0).optional(),
  limit: z.number().min(1).max(100).default(20).optional(),
  type: z.string().optional(),
});

export const listRequestsSchema = z.object({
  page: z.number().min(0).default(0),
  count: z.number().min(1).max(100).default(20),
  status: z.enum(["pending", "approved", "rejected", "in_review"]).optional(),
  facultyId: z.cuid("invalid-faculty-id").optional(),
  type: z.string().optional(),
  accountId: z.cuid("invalid-account-id").optional(),
});

export const getRequestDetailSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
});

export const approveRequestSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
  response: z.string().max(2000).optional(),
});

export const rejectRequestSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
  response: z.string().min(1, "response-required").max(2000),
});

export const reviewRequestSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
});

export const resolveRequestSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
  response: z.string().max(2000).optional(),
});

export const assignRequestSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
  assignedToId: z.cuid("invalid-account-id"),
});

export const addRequestResponseSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
  response: z.string().min(1, "response-required").max(2000),
});
