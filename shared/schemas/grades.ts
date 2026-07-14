import { z } from "zod";

export const recordGradeSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
  description: z.string().min(1, "description-too-short").max(100, "description-too-long"),
  score: z.number().min(0, "score-too-low").max(100, "score-too-high"),
});

export const updateGradeSchema = z.object({
  gradeId: z.cuid("invalid-grade-id"),
  description: z.string().min(1, "description-too-short").max(100, "description-too-long").optional(),
  score: z.number().min(0, "score-too-low").max(100, "score-too-high").optional(),
});

export const deleteGradeSchema = z.object({
  gradeId: z.cuid("invalid-grade-id"),
});

export const listMyGradesSchema = z.object({
  courseId: z.cuid("invalid-course-id").optional(),
  periodId: z.cuid("invalid-period-id").optional(),
});

export const listStudentGradesSchema = z.object({
  accountId: z.cuid("invalid-account-id"),
  courseId: z.cuid("invalid-course-id").optional(),
});

export const listCourseGradesSchema = z.object({
  courseId: z.cuid("invalid-course-id"),
});

export const listFacultyGradesSchema = z.object({
  facultyId: z.cuid("invalid-faculty-id"),
  periodId: z.cuid("invalid-period-id").optional(),
});

export const getGradeDetailSchema = z.object({
  gradeId: z.cuid("invalid-grade-id"),
});

export const publishFinalGradeSchema = z.object({
  enrollmentId: z.cuid("invalid-enrollment-id"),
});

export const bulkRecordGradesSchema = z.object({
  grades: z.array(z.object({
    enrollmentId: z.cuid("invalid-enrollment-id"),
    description: z.string().min(1).max(100),
    score: z.number().min(0).max(100),
  })).min(1, "grades-too-few").max(100, "grades-too-many"),
});
