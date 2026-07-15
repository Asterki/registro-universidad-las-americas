import { Faculty, Prisma } from "@prisma/client";
import { ResponseStatus } from "./index.js";
import { z } from "zod";

import {
  createFacultySchema,
  updateFacultySchema,
  deleteFacultySchema,
  restoreFacultySchema,
  getFacultySchema,
  listFacultiesSchema,
} from "../schemas/faculties.js";

export type CreateFacultyRequestBody = z.infer<typeof createFacultySchema>;
export type UpdateFacultyRequestBody = z.infer<typeof updateFacultySchema>;
export type DeleteFacultyRequestBody = z.infer<typeof deleteFacultySchema>;
export type RestoreFacultyRequestBody = z.infer<typeof restoreFacultySchema>;
export type GetFacultyRequestBody = z.infer<typeof getFacultySchema>;
export type ListFacultiesRequestBody = z.infer<typeof listFacultiesSchema>;

export interface GetFacultyResponseData {
  status: ResponseStatus;
  faculties?: Prisma.FacultyGetPayload<{
    include: { metadata: true; campus: true };
  }>[];
}

export interface ListFacultiesResponseData {
  status: ResponseStatus;
  faculties?: Prisma.FacultyGetPayload<{
    include: { metadata: true; campus: true };
  }>[];
  totalFaculties?: number;
}

export interface CreateFacultyResponseData {
  status: ResponseStatus | "name-in-use" | "code-in-use" | "campus-not-found";
  faculty?: Faculty;
}

export interface UpdateFacultyResponseData {
  status: ResponseStatus | "faculty-not-found" | "name-in-use" | "code-in-use";
  faculty?: Faculty;
}

export interface DeleteFacultyResponseData {
  status: ResponseStatus | "faculty-not-found";
  faculty?: Faculty;
}

export interface RestoreFacultyResponseData {
  status: ResponseStatus | "faculty-not-found";
  faculty?: Faculty;
}
