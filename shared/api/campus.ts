import { Campus, Prisma } from "@prisma/client";
import { ResponseStatus } from "./index.js";
import { z } from "zod";

import {
  createSchema,
  deleteSchema,
  getSchema,
  updateSchema,
  listSchema,
  restoreSchema,
} from "../schemas/campus.js";

// Inferred request body types
export type GetRequestBody = z.infer<typeof getSchema>;
export type CreateRequestBody = z.infer<typeof createSchema>;
export type DeleteRequestBody = z.infer<typeof deleteSchema>;
export type RestoreRequestBody = z.infer<typeof restoreSchema>;
export type UpdateRequestBody = z.infer<typeof updateSchema>;
export type ListRequestBody = z.infer<typeof listSchema>;

// Response types
export interface GetResponseData {
  status: ResponseStatus;
  campuses?: Prisma.CampusGetPayload<{
    include: {
      metadata: true;
    };
  }>[];
}

export interface ListResponseData {
  status: ResponseStatus;
  campuses?: Prisma.CampusGetPayload<{
    include: {
      metadata: true;
    };
  }>[];
  totalCampuses?: number;
}

export interface DeleteResponseData {
  status: ResponseStatus | "campus-not-found";
  campus?: Campus;
}

export interface RestoreResponseData {
  status: ResponseStatus | "campus-not-found";
  campus?: Campus;
}

export interface CreateResponseData {
  status: ResponseStatus | "name-in-use";
  campus?: Campus;
}

export interface UpdateResponseData {
  status: ResponseStatus | "name-in-use" | "campus-not-found";
  campus?: Campus;
}

