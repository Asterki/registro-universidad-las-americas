import { z } from "zod";
import { metadataFields, metadataPopulateFields } from "./index.js";

export const listPeriodsSchema = z.object({
  fields: z.array(z.enum([...metadataFields, "id", "name", "startDate", "endDate", "active"], "invalid-field")).optional(),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
  active: z.boolean().optional(),
  name: z.string().optional(),
});

export const getActivePeriodSchema = z.object({
  fields: z.array(z.enum([...metadataFields, "id", "name", "startDate", "endDate", "active"], "invalid-field")).optional(),
});

export const getPeriodDetailSchema = z.object({
  periodId: z.cuid("invalid-period-id"),
});

//#region Period CRUD
export const createPeriodSchema = z.object({
  name: z.string().min(1, "name-too-short").max(50, "name-too-long"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  active: z.boolean().default(true),
});

export const updatePeriodSchema = z.object({
  periodId: z.cuid("invalid-period-id"),
  name: z.string().min(1, "name-too-short").max(50, "name-too-long").optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  active: z.boolean().optional(),
});

export const deletePeriodSchema = z.object({
  periodId: z.cuid("invalid-period-id"),
});

export const restorePeriodSchema = z.object({
  periodId: z.cuid("invalid-period-id"),
});

const periodFields = z.enum(
  [...metadataFields, "id", "name", "startDate", "endDate", "active"],
  "invalid-field",
);

export const listAllPeriodsSchema = z.object({
  count: z.number().min(1, "count-too-low"),
  page: z.number().min(0, "page-too-low"),
  includeDeleted: z.boolean().optional(),
  active: z.boolean().optional(),
  fields: z.array(periodFields).optional(),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
});

export const getPeriodSchema = z.object({
  periodIds: z.array(z.cuid()),
  fields: z.array(periodFields).optional(),
  populate: z.array(z.enum(metadataPopulateFields, "invalid-populate-path")).optional(),
});
//#endregion
