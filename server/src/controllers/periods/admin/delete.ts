import { Request, Response, NextFunction } from "express";
import * as PeriodAPITypes from "../../../../../shared/api/period.js";

import LoggingService from "../../../services/logging.js";

import {
  PeriodNotFoundError,
  deletePeriodWithRetry,
} from "../../../services/period/delete.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, PeriodAPITypes.DeletePeriodRequestBody>,
  res: Response<PeriodAPITypes.DeletePeriodResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { periodId } = req.body;
  const userAccount = req.user!;

  try {
    const deletedPeriod = await deletePeriodWithRetry(periodId, {
      traceId: req.traceId,
      userAccount: userAccount,
    });

    res.status(200).json({
      status: "success",
      period: deletedPeriod,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof PeriodNotFoundError) {
      res.status(404).json({
        status: "period-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:periods:delete",
        level: "error",
        message: "Prisma error during period deletion",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:periods:delete",
        level: "error",
        message: "Error during period deletion",
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
