import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  listCampusesSchema,
  listFacultiesSchema,
  listFacultiesByCampusSchema,
  listRolesSchema,
  listRequestStatusesSchema,
  listEnrollmentStatusesSchema,
} from "../schemas/catalogs.js";

export type ListCampusesRequestBody = z.infer<typeof listCampusesSchema>;
export type ListFacultiesRequestBody = z.infer<typeof listFacultiesSchema>;
export type ListFacultiesByCampusRequestBody = z.infer<typeof listFacultiesByCampusSchema>;
export type ListRolesRequestBody = z.infer<typeof listRolesSchema>;
export type ListRequestStatusesRequestBody = z.infer<typeof listRequestStatusesSchema>;
export type ListEnrollmentStatusesRequestBody = z.infer<typeof listEnrollmentStatusesSchema>;

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
