import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  enrollSelfSchema,
  enrollStudentSchema,
  cancelSelfSchema,
  cancelStudentSchema,
  validateEnrollmentSchema,
  listMyEnrollmentsSchema,
  listStudentEnrollmentsSchema,
  listCourseEnrollmentsSchema,
  getEnrollmentDetailSchema,
  completeEnrollmentSchema,
  failEnrollmentSchema,
} from "../schemas/enrollment.js";

export type EnrollSelfRequestBody = z.infer<typeof enrollSelfSchema>;
export type EnrollStudentRequestBody = z.infer<typeof enrollStudentSchema>;
export type CancelSelfRequestBody = z.infer<typeof cancelSelfSchema>;
export type CancelStudentRequestBody = z.infer<typeof cancelStudentSchema>;
export type ValidateEnrollmentRequestBody = z.infer<typeof validateEnrollmentSchema>;
export type ListMyEnrollmentsRequestBody = z.infer<typeof listMyEnrollmentsSchema>;
export type ListStudentEnrollmentsRequestBody = z.infer<typeof listStudentEnrollmentsSchema>;
export type ListCourseEnrollmentsRequestBody = z.infer<typeof listCourseEnrollmentsSchema>;
export type GetEnrollmentDetailRequestBody = z.infer<typeof getEnrollmentDetailSchema>;
export type CompleteEnrollmentRequestBody = z.infer<typeof completeEnrollmentSchema>;
export type FailEnrollmentRequestBody = z.infer<typeof failEnrollmentSchema>;

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
