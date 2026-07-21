import { Request, Response, NextFunction } from "express";
import * as CampusAPITypes from "../../../../../shared/api/campus.js";

import LoggingService from "../../../services/logging.js";

import {
  CampusNotFoundError,
  deleteCampusWithRetry,
} from "../../../services/campus/delete.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CampusAPITypes.DeleteRequestBody>,
  res: Response<CampusAPITypes.DeleteResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { campusId } = req.body;
  const userAccount = req.user!;

  try {
    const deletedCampus = await deleteCampusWithRetry(campusId, {
      traceId: req.traceId,
      userAccount: userAccount,
    });

    res.status(200).json({
      status: "success",
      campus: deletedCampus,
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
        source: "api:campus:delete",
        level: "error",
        message: "Prisma error during campus deletion",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:campus:delete",
        level: "error",
        message: "Error during campus deletion",
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
