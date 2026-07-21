import { ResponseStatus } from "./index.js";

export interface GetCoordinatorFacultyScopeRequestBody {
  coordinatorId?: string;
}

export interface ListCoordinatorCoursesRequestBody {
  coordinatorId?: string;
  count?: number;
  page?: number;
}

export interface ListCoordinatorStudentsRequestBody {
  coordinatorId?: string;
  courseId?: string;
  count?: number;
  page?: number;
}

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
