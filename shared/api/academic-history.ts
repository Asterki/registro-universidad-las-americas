import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  getMyAcademicHistorySchema,
  getStudentAcademicHistorySchema,
  getTranscriptSchema,
  checkPrerequisitesSchema,
} from "../schemas/academic-history.js";

export type GetMyAcademicHistoryRequestBody = z.infer<typeof getMyAcademicHistorySchema>;
export type GetStudentAcademicHistoryRequestBody = z.infer<typeof getStudentAcademicHistorySchema>;
export type GetTranscriptRequestBody = z.infer<typeof getTranscriptSchema>;
export type CheckPrerequisitesRequestBody = z.infer<typeof checkPrerequisitesSchema>;

export interface AcademicHistoryResponse {
  status: ResponseStatus;
  history?: any[];
  summary?: {
    totalCredits?: number;
    gpa?: number;
    completedCourses?: number;
  };
}

export interface TranscriptResponse {
  status: ResponseStatus;
  transcript?: any;
  student?: any;
}

export interface PrerequisitesResponse {
  status: ResponseStatus | "valid" | "invalid";
  met?: boolean;
  missingPrerequisites?: any[];
}
