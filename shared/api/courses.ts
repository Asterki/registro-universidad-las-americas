import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  listCoursesByPeriodSchema,
  listCoursesByFacultySchema,
  getCourseDetailSchema,
  getCoursePrerequisitesSchema,
  listAvailableCoursesForStudentSchema,
  getCourseRosterSchema,
  createCourseSchema,
  updateCourseSchema,
  deleteCourseSchema,
  restoreCourseSchema,
  listCoursesSchema,
  getCourseSchema,
} from "../schemas/courses.js";

export type ListCoursesByPeriodRequestBody = z.infer<
  typeof listCoursesByPeriodSchema
>;
export type ListCoursesByFacultyRequestBody = z.infer<
  typeof listCoursesByFacultySchema
>;
export type GetCourseDetailRequestBody = z.infer<typeof getCourseDetailSchema>;
export type GetCoursePrerequisitesRequestBody = z.infer<
  typeof getCoursePrerequisitesSchema
>;
export type ListAvailableCoursesForStudentRequestBody = z.infer<
  typeof listAvailableCoursesForStudentSchema
>;
export type GetCourseRosterRequestBody = z.infer<typeof getCourseRosterSchema>;

export interface ListCoursesResponse {
  status: ResponseStatus;
  courses?: any[];
  total?: number;
}

export interface CourseDetailResponse {
  status: ResponseStatus | "course-not-found";
  course?: any;
}

export interface CoursePrerequisitesResponse {
  status: ResponseStatus;
  prerequisites?: any[];
}

export interface CourseRosterResponse {
  status: ResponseStatus;
  students?: any[];
}

//#region Course CRUD
export type CreateCourseRequestBody = z.infer<typeof createCourseSchema>;
export type UpdateCourseRequestBody = z.infer<typeof updateCourseSchema>;
export type DeleteCourseRequestBody = z.infer<typeof deleteCourseSchema>;
export type RestoreCourseRequestBody = z.infer<typeof restoreCourseSchema>;
export type ListCoursesRequestBody = z.infer<typeof listCoursesSchema>;
export type GetCourseRequestBody = z.infer<typeof getCourseSchema>;

export interface CreateCourseResponseData {
  status: ResponseStatus | "faculty-not-found" | "period-not-found";
  course?: any;
}

export interface UpdateCourseResponseData {
  status:
    | ResponseStatus
    | "course-not-found"
    | "faculty-not-found"
    | "period-not-found"
    | "course-code-exists";
  course?: any;
}

export interface DeleteCourseResponseData {
  status: ResponseStatus | "course-not-found";
  course?: any;
}

export interface RestoreCourseResponseData {
  status: ResponseStatus | "course-not-found";
  course?: any;
}

export interface ListCoursesResponseData {
  status: ResponseStatus;
  courses?: any[];
  totalCourses?: number;
}
//#endregion
