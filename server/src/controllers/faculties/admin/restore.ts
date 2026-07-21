import { Request, Response, NextFunction } from "express";

import * as FacultiesAPITypes from "../../../../../shared/api/faculties.js";

import LoggingService from "../../../services/logging.js";
import {
  FacultyNotFoundError,
  restoreFacultyWithRetry,
} from "../../../services/faculties/restore.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, FacultiesAPITypes.RestoreFacultyRequestBody>,
  res: Response<FacultiesAPITypes.RestoreFacultyResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { facultyId } = req.body;
  const userAccount = req.user!;

  try {
    const restoredFaculty = await restoreFacultyWithRetry(facultyId, {
      traceId: req.traceId,
      userAccount,
    });

    res.status(200).json({
      status: "success",
      faculty: restoredFaculty,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof FacultyNotFoundError) {
      res.status(404).json({
        status: "faculty-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:faculties:restore",
        level: "error",
        message: "Prisma error during faculty restore",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:faculties:restore",
        level: "error",
        message: "Error during faculty restore",
        traceId: req.traceId,
        details: {
          error: error.message,
          stack: error.stack,
        },
        duration,
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
