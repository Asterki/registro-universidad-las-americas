import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  assignInstructorSchema,
  removeInstructorSchema,
  listCourseInstructorsSchema,
  listInstructorCoursesSchema,
  activateInstructorAssignmentSchema,
  deactivateInstructorAssignmentSchema,
} from "../schemas/course-instructor.js";

export type AssignInstructorRequestBody = z.infer<typeof assignInstructorSchema>;
export type RemoveInstructorRequestBody = z.infer<typeof removeInstructorSchema>;
export type ListCourseInstructorsRequestBody = z.infer<typeof listCourseInstructorsSchema>;
export type ListInstructorCoursesRequestBody = z.infer<typeof listInstructorCoursesSchema>;
export type ActivateInstructorAssignmentRequestBody = z.infer<typeof activateInstructorAssignmentSchema>;
export type DeactivateInstructorAssignmentRequestBody = z.infer<typeof deactivateInstructorAssignmentSchema>;

export interface CourseInstructorResponse {
  status: ResponseStatus | "assignment-not-found" | "already-assigned" | "instructor-not-found" | "course-not-found";
  assignment?: any;
}

export interface ListCourseInstructorsResponse {
  status: ResponseStatus;
  instructors?: any[];
}

export interface ListInstructorCoursesResponse {
  status: ResponseStatus;
  courses?: any[];
}
