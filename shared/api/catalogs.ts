import { ResponseStatus } from "./index.js";

export interface ListCampusesRequestBody {
  count?: number;
  page?: number;
}

export interface ListFacultiesRequestBody {
  count?: number;
  page?: number;
  campusId?: string;
}

export interface ListFacultiesByCampusRequestBody {
  campusId: string;
  count?: number;
  page?: number;
}

export interface ListRolesRequestBody {
  count?: number;
  page?: number;
}

export interface ListRequestStatusesRequestBody {
  count?: number;
  page?: number;
}

export interface ListEnrollmentStatusesRequestBody {
  count?: number;
  page?: number;
}

export interface ListCampusesResponse {
  status: ResponseStatus;
  campuses?: any[];
}

export interface ListFacultiesResponse {
  status: ResponseStatus;
  faculties?: any[];
}

export interface ListRolesResponse {
  status: ResponseStatus;
  roles?: any[];
}

export interface ListStatusesResponse {
  status: ResponseStatus;
  statuses?: string[];
}
