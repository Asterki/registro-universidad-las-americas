import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  listAllAcademicRequestsSchema,
  processAcademicRequestSchema,
  listAllInstructorsSchema,
} from "../schemas/registry.js";

export type ListAllAcademicRequestsRequestBody = z.infer<typeof listAllAcademicRequestsSchema>;
export type ProcessAcademicRequestRequestBody = z.infer<typeof processAcademicRequestSchema>;
export type ListAllInstructorsRequestBody = z.infer<typeof listAllInstructorsSchema>;

export interface ListAllRequestsResponse {
  status: ResponseStatus;
  requests?: any[];
  total?: number;
}

export interface ProcessRequestResponse {
  status: ResponseStatus | "request-not-found" | "invalid-action";
  request?: any;
}

export interface ListAllInstructorsResponse {
  status: ResponseStatus;
  instructors?: any[];
  total?: number;
}
