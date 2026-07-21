import { ResponseStatus } from "./index.js";
import { z } from "zod";
import {
  listPeriodsSchema,
  getPeriodSchema,
  createPeriodSchema,
  updatePeriodSchema,
  deletePeriodSchema,
  restorePeriodSchema,
} from "../schemas/period.js";

export type ListPeriodsRequestBody = z.infer<typeof listPeriodsSchema>;
export type GetActivePeriodRequestBody = z.infer<typeof getPeriodSchema>;
export type GetPeriodDetailRequestBody = z.infer<typeof getPeriodSchema>;

export interface ListPeriodsResponse {
  status: ResponseStatus;
  periods?: any[];
}

export interface PeriodResponse {
  status: ResponseStatus | "period-not-found";
  period?: any;
}

//#region Period CRUD
export type CreatePeriodRequestBody = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodRequestBody = z.infer<typeof updatePeriodSchema>;
export type DeletePeriodRequestBody = z.infer<typeof deletePeriodSchema>;
export type RestorePeriodRequestBody = z.infer<typeof restorePeriodSchema>;
export type ListAllPeriodsRequestBody = z.infer<typeof listPeriodsSchema>;
export type GetPeriodRequestBody = z.infer<typeof getPeriodSchema>;

export interface CreatePeriodResponseData {
  status: ResponseStatus | "period-end-before-start" | "period-name-in-use";
  period?: any;
}

export interface UpdatePeriodResponseData {
  status: ResponseStatus | "period-not-found" | "period-end-before-start" | "period-name-in-use";
  period?: any;
}

export interface DeletePeriodResponseData {
  status: ResponseStatus | "period-not-found";
  period?: any;
}

export interface RestorePeriodResponseData {
  status: ResponseStatus | "period-not-found";
  period?: any;
}

export interface ListAllPeriodsResponseData {
  status: ResponseStatus;
  periods?: any[];
  totalPeriods?: number;
}
//#endregion
