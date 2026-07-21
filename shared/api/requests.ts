import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  createRequestSchema,
  listRequestsSchema,
  getRequestSchema,
  updateRequestSchema,
} from "../schemas/requests.js";

export type CreateMyRequestRequestBody = z.infer<typeof createRequestSchema>;
export type CreateRequestForStudentRequestBody = z.infer<typeof createRequestSchema>;
export type ListMyRequestsRequestBody = z.infer<typeof listRequestsSchema>;
export type ListRequestsRequestBody = z.infer<typeof listRequestsSchema>;
export type GetRequestDetailRequestBody = z.infer<typeof getRequestSchema>;
export type ApproveRequestRequestBody = z.infer<typeof updateRequestSchema>;
export type RejectRequestRequestBody = z.infer<typeof updateRequestSchema>;
export type ReviewRequestRequestBody = z.infer<typeof updateRequestSchema>;
export type ResolveRequestRequestBody = z.infer<typeof updateRequestSchema>;
export type AssignRequestRequestBody = z.infer<typeof updateRequestSchema>;
export type AddRequestResponseRequestBody = z.infer<typeof updateRequestSchema>;

export interface RequestResponse {
  status: ResponseStatus | "request-not-found" | "invalid-status-transition";
  request?: any;
}

export interface ListRequestsResponse {
  status: ResponseStatus;
  requests?: any[];
  total?: number;
}
