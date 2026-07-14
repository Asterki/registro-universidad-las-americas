import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  recordGradeSchema,
  updateGradeSchema,
  deleteGradeSchema,
  listMyGradesSchema,
  listStudentGradesSchema,
  listCourseGradesSchema,
  listFacultyGradesSchema,
  getGradeDetailSchema,
  publishFinalGradeSchema,
  bulkRecordGradesSchema,
} from "../schemas/grades.js";

export type RecordGradeRequestBody = z.infer<typeof recordGradeSchema>;
export type UpdateGradeRequestBody = z.infer<typeof updateGradeSchema>;
export type DeleteGradeRequestBody = z.infer<typeof deleteGradeSchema>;
export type ListMyGradesRequestBody = z.infer<typeof listMyGradesSchema>;
export type ListStudentGradesRequestBody = z.infer<typeof listStudentGradesSchema>;
export type ListCourseGradesRequestBody = z.infer<typeof listCourseGradesSchema>;
export type ListFacultyGradesRequestBody = z.infer<typeof listFacultyGradesSchema>;
export type GetGradeDetailRequestBody = z.infer<typeof getGradeDetailSchema>;
export type PublishFinalGradeRequestBody = z.infer<typeof publishFinalGradeSchema>;
export type BulkRecordGradesRequestBody = z.infer<typeof bulkRecordGradesSchema>;

export interface GradeResponse {
  status: ResponseStatus | "enrollment-not-found" | "grade-not-found";
  grade?: any;
}

export interface ListGradesResponse {
  status: ResponseStatus;
  grades?: any[];
  total?: number;
}

export interface GradeDetailResponse {
  status: ResponseStatus | "grade-not-found";
  grade?: any;
}

export interface BulkGradesResponse {
  status: ResponseStatus;
  grades?: any[];
  errors?: any[];
}
