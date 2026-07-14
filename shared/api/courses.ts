import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  listCoursesByPeriodSchema,
  listCoursesByFacultySchema,
  getCourseDetailSchema,
  getCoursePrerequisitesSchema,
  listAvailableCoursesForStudentSchema,
  getCourseRosterSchema,
} from "../schemas/courses.js";

export type ListCoursesByPeriodRequestBody = z.infer<typeof listCoursesByPeriodSchema>;
export type ListCoursesByFacultyRequestBody = z.infer<typeof listCoursesByFacultySchema>;
export type GetCourseDetailRequestBody = z.infer<typeof getCourseDetailSchema>;
export type GetCoursePrerequisitesRequestBody = z.infer<typeof getCoursePrerequisitesSchema>;
export type ListAvailableCoursesForStudentRequestBody = z.infer<typeof listAvailableCoursesForStudentSchema>;
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
