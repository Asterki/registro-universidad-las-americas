import { ResponseStatus } from "./index.js";
import { Account, Course } from "@prisma/client";

export interface AssignInstructorRequestBody {
  courseId: string;
  accountId: string;
}

export interface RemoveInstructorRequestBody {
  courseId: string;
  accountId: string;
}

export interface ListCourseInstructorsRequestBody {
  courseId: string;
}

export interface ListInstructorCoursesRequestBody {
  accountId: string;
}

export interface ActivateInstructorAssignmentRequestBody {
  courseId: string;
  accountId: string;
}

export interface DeactivateInstructorAssignmentRequestBody {
  courseId: string;
  accountId: string;
}

export interface CourseInstructorResponse {
  status: ResponseStatus | "assignment-not-found" | "already-assigned" | "instructor-not-found" | "course-not-found";
  course?: Course;
  instructor?: Account;
}

export interface ListCourseInstructorsResponse {
  status: ResponseStatus;
  instructors?: Account[];
}

export interface ListInstructorCoursesResponse {
  status: ResponseStatus;
  courses?: Course[];
}
