import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  getMyProfileSchema,
  getStudentProfileSchema,
  getInstructorProfileSchema,
  assignInstructorCampusSchema,
  removeInstructorCampusSchema,
  listFacultyStudentsSchema,
  listFacultyInstructorsSchema,
} from "../schemas/account-profiles.js";

export type GetMyProfileRequestBody = z.infer<typeof getMyProfileSchema>;
export type GetStudentProfileRequestBody = z.infer<typeof getStudentProfileSchema>;
export type GetInstructorProfileRequestBody = z.infer<typeof getInstructorProfileSchema>;
export type AssignInstructorCampusRequestBody = z.infer<typeof assignInstructorCampusSchema>;
export type RemoveInstructorCampusRequestBody = z.infer<typeof removeInstructorCampusSchema>;
export type ListFacultyStudentsRequestBody = z.infer<typeof listFacultyStudentsSchema>;
export type ListFacultyInstructorsRequestBody = z.infer<typeof listFacultyInstructorsSchema>;

export interface ProfileResponse {
  status: ResponseStatus | "account-not-found";
  account?: any;
}

export interface CampusAssignmentResponse {
  status: ResponseStatus | "account-not-found" | "campus-not-found";
  account?: any;
}

export interface ListFacultyAccountsResponse {
  status: ResponseStatus;
  accounts?: any[];
  total?: number;
}
