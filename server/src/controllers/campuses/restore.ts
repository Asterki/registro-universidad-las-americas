import { Request, Response, NextFunction } from "express";

import * as CampusesAPITypes from "../../../../shared/api/campus.js";

import LoggingService from "../../services/logging.js";
import {
  CampusNotFoundError,
  restoreCampusWithRetry,
} from "../../services/campus/restore.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CampusesAPITypes.RestoreRequestBody>,
  res: Response<CampusesAPITypes.RestoreResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { campusId } = req.body;
  const userAccount = req.user!;

  try {
    const restoredCampus = await restoreCampusWithRetry(campusId, {
      traceId: req.traceId,
      userAccount,
    });

    res.status(200).json({
      status: "success",
      campus: restoredCampus,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CampusNotFoundError) {
      res.status(404).json({
        status: "campus-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:campus:restore",
        level: "error",
        message: "Prisma error during campus restore",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:campus:restore",
        level: "error",
        message: "Error during campus restore",
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
