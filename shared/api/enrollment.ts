import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  listEnrollmentsSchema,
  getEnrollmentSchema,
} from "../schemas/enrollment.js";

export type EnrollSelfRequestBody = z.infer<typeof createEnrollmentSchema>;
export type EnrollStudentRequestBody = z.infer<typeof createEnrollmentSchema>;
export type CancelSelfRequestBody = z.infer<typeof updateEnrollmentSchema>;
export type CancelStudentRequestBody = z.infer<typeof updateEnrollmentSchema>;
export type ValidateEnrollmentRequestBody = z.infer<typeof getEnrollmentSchema>;
export type ListMyEnrollmentsRequestBody = z.infer<typeof listEnrollmentsSchema>;
export type ListStudentEnrollmentsRequestBody = z.infer<typeof listEnrollmentsSchema>;
export type ListCourseEnrollmentsRequestBody = z.infer<typeof listEnrollmentsSchema>;
export type GetEnrollmentDetailRequestBody = z.infer<typeof getEnrollmentSchema>;
export type CompleteEnrollmentRequestBody = z.infer<typeof updateEnrollmentSchema>;
export type FailEnrollmentRequestBody = z.infer<typeof updateEnrollmentSchema>;

export interface EnrollResponse {
  status: ResponseStatus | "already-enrolled" | "course-full" | "prerequisites-not-met" | "invalid-period";
  enrollment?: any;
}

export interface CancelResponse {
  status: ResponseStatus | "enrollment-not-found" | "already-cancelled";
  enrollment?: any;
}

export interface ValidateResponse {
  status: ResponseStatus | "valid";
  valid?: boolean;
  reasons?: string[];
}

export interface ListEnrollmentsResponse {
  status: ResponseStatus;
  enrollments?: any[];
  total?: number;
}

export interface EnrollmentDetailResponse {
  status: ResponseStatus | "enrollment-not-found";
  enrollment?: any;
}

export interface EnrollmentStatusResponse {
  status: ResponseStatus | "enrollment-not-found";
  enrollment?: any;
}
