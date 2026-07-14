import { z } from "zod";

export const listAllAcademicRequestsSchema = z.object({
  page: z.number().min(0).default(0),
  count: z.number().min(1).max(100).default(20),
  status: z.enum(["pending", "approved", "rejected", "in_review"]).optional(),
  facultyId: z.cuid("invalid-faculty-id").optional(),
});

export const processAcademicRequestSchema = z.object({
  requestId: z.cuid("invalid-request-id"),
  action: z.enum(["approve", "reject", "review", "resolve"]),
  response: z.string().max(2000).optional(),
});

export const listAllInstructorsSchema = z.object({
  page: z.number().min(0).optional(),
  count: z.number().min(1).max(100).optional(),
  facultyId: z.cuid("invalid-faculty-id").optional(),
});
