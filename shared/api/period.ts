import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  listPeriodsSchema,
  getActivePeriodSchema,
  getPeriodDetailSchema,
} from "../schemas/period.js";

export type ListPeriodsRequestBody = z.infer<typeof listPeriodsSchema>;
export type GetActivePeriodRequestBody = z.infer<typeof getActivePeriodSchema>;
export type GetPeriodDetailRequestBody = z.infer<typeof getPeriodDetailSchema>;

export interface ListPeriodsResponse {
  status: ResponseStatus;
  periods?: any[];
}

export interface PeriodResponse {
  status: ResponseStatus | "period-not-found";
  period?: any;
}
