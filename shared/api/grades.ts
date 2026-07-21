import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  createGradeSchema,
  updateGradeSchema,
  deleteGradeSchema,
  listGradesSchema,
  getGradeSchema,
} from "../schemas/grades.js";

const gradeEntrySchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
  description: z.string().min(1).max(100),
  score: z.number().min(0).max(100),
});

export type RecordGradeRequestBody = z.infer<typeof gradeEntrySchema>;
export type UpdateGradeRequestBody = z.infer<typeof updateGradeSchema>;
export type DeleteGradeRequestBody = z.infer<typeof deleteGradeSchema>;
export type ListMyGradesRequestBody = z.infer<typeof listGradesSchema>;
export type ListStudentGradesRequestBody = z.infer<typeof listGradesSchema>;
export type ListCourseGradesRequestBody = z.infer<typeof listGradesSchema>;
export type ListFacultyGradesRequestBody = z.infer<typeof listGradesSchema>;
export type GetGradeDetailRequestBody = z.infer<typeof getGradeSchema>;

export interface PublishFinalGradeRequestBody {
  enrollmentId: string;
}

export interface BulkRecordGradesRequestBody {
  grades: Array<{
    enrollmentId: string;
    description: string;
    score: number;
  }>;
}

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
