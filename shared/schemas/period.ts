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
