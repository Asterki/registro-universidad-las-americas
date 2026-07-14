import { z } from "zod";

export const getCoordinatorFacultyScopeSchema = z.object({});

export const listCoordinatorCoursesSchema = z.object({
  periodId: z.cuid("invalid-period-id").optional(),
});

export const listCoordinatorStudentsSchema = z.object({
  page: z.number().min(0).optional(),
  count: z.number().min(1).max(100).optional(),
});
