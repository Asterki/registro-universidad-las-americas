import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  getCoordinatorFacultyScopeSchema,
  listCoordinatorCoursesSchema,
  listCoordinatorStudentsSchema,
} from "../schemas/coordinator.js";

export type GetCoordinatorFacultyScopeRequestBody = z.infer<typeof getCoordinatorFacultyScopeSchema>;
export type ListCoordinatorCoursesRequestBody = z.infer<typeof listCoordinatorCoursesSchema>;
export type ListCoordinatorStudentsRequestBody = z.infer<typeof listCoordinatorStudentsSchema>;

export interface CoordinatorScopeResponse {
  status: ResponseStatus | "not-coordinator";
  faculty?: any;
}

export interface CoordinatorCoursesResponse {
  status: ResponseStatus;
  courses?: any[];
}

export interface CoordinatorStudentsResponse {
  status: ResponseStatus;
  students?: any[];
  total?: number;
}
