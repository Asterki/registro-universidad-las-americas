import { Request, Response, NextFunction } from "express";
import * as FacultiesAPITypes from "../../../../../shared/api/faculties.js";

import LoggingService from "../../../services/logging.js";
import {
  FacultyNotFoundError,
  updateFacultyWithRetry,
} from "../../../services/faculties/update.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, FacultiesAPITypes.UpdateFacultyRequestBody>,
  res: Response<FacultiesAPITypes.UpdateFacultyResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { facultyId, name, code, dean, campusId, coordinatorIds } = req.body;
  const userAccount = req.user!;

  try {
    const updatedFaculty = await updateFacultyWithRetry(
      {
        facultyId,
        name,
        code,
        dean,
        campusId,
        coordinatorIds,
      },
      {
        traceId: req.traceId,
        userAccount: userAccount,
      },
    );

    const duration = performance.now() - start;
    LoggingService.log({
      source: "api:faculties:update",
      level: "info",
      message: "Faculty updated successfully",
      traceId: req.traceId,
      duration,
      details: {
        updatedById: userAccount.id,
        faculty: updatedFaculty.id,
      },
      _references: {
        updatedById: "Account",
        faculty: "Faculty",
      },
    });

    res.status(200).json({
      status: "success",
      faculty: updatedFaculty,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof FacultyNotFoundError) {
      res.status(404).json({ status: "faculty-not-found" });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:faculties:update",
        level: "error",
        message: "Prisma error during faculty update",
        traceId: req.traceId,
        details: { code: error, meta: error },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:faculties:update",
        level: "error",
        message: "Error during faculty update",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
