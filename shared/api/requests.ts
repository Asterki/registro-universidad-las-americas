import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  createMyRequestSchema,
  createRequestForStudentSchema,
  listMyRequestsSchema,
  listRequestsSchema,
  getRequestDetailSchema,
  approveRequestSchema,
  rejectRequestSchema,
  reviewRequestSchema,
  resolveRequestSchema,
  assignRequestSchema,
  addRequestResponseSchema,
} from "../schemas/requests.js";

export type CreateMyRequestRequestBody = z.infer<typeof createMyRequestSchema>;
export type CreateRequestForStudentRequestBody = z.infer<typeof createRequestForStudentSchema>;
export type ListMyRequestsRequestBody = z.infer<typeof listMyRequestsSchema>;
export type ListRequestsRequestBody = z.infer<typeof listRequestsSchema>;
export type GetRequestDetailRequestBody = z.infer<typeof getRequestDetailSchema>;
export type ApproveRequestRequestBody = z.infer<typeof approveRequestSchema>;
export type RejectRequestRequestBody = z.infer<typeof rejectRequestSchema>;
export type ReviewRequestRequestBody = z.infer<typeof reviewRequestSchema>;
export type ResolveRequestRequestBody = z.infer<typeof resolveRequestSchema>;
export type AssignRequestRequestBody = z.infer<typeof assignRequestSchema>;
export type AddRequestResponseRequestBody = z.infer<typeof addRequestResponseSchema>;

export interface RequestResponse {
  status: ResponseStatus | "request-not-found" | "invalid-status-transition";
  request?: any;
}

export interface ListRequestsResponse {
  status: ResponseStatus;
  requests?: any[];
  total?: number;
}
