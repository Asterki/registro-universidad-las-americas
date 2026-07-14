import { z } from "zod";
import { metadataFields } from "./index.js";

export const listCampusesSchema = z.object({
  fields: z.array(z.enum([...metadataFields, "id", "name", "city"], "invalid-field")).optional(),
});

export const listFacultiesSchema = z.object({
  fields: z.array(z.enum([...metadataFields, "id", "name", "code", "campusId"], "invalid-field")).optional(),
});

export const listFacultiesByCampusSchema = z.object({
  campusId: z.cuid("invalid-campus-id"),
});

export const listRolesSchema = z.object({});

export const listRequestStatusesSchema = z.object({});

export const listEnrollmentStatusesSchema = z.object({});
