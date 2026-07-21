import { Request, Response, NextFunction } from "express";
import * as PeriodAPITypes from "../../../../../shared/api/period.js";

import LoggingService from "../../../services/logging.js";
import {
  PeriodNotFoundError,
  updatePeriodWithRetry,
} from "../../../services/period/update.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, PeriodAPITypes.UpdatePeriodRequestBody>,
  res: Response<PeriodAPITypes.UpdatePeriodResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { periodId, name, startDate, endDate, active } = req.body;
  const userAccount = req.user!;

  try {
    const updatedPeriod = await updatePeriodWithRetry(
      {
        periodId,
        name,
        startDate,
        endDate,
        active,
      },
      {
        traceId: req.traceId,
        userAccount: userAccount,
      },
    );

    const duration = performance.now() - start;
    LoggingService.log({
      source: "api:periods:update",
      level: "info",
      message: "Period updated successfully",
      traceId: req.traceId,
      duration,
      details: {
        updatedById: userAccount.id,
        period: updatedPeriod.id,
      },
      _references: {
        updatedById: "Account",
        period: "Period",
      },
    });

    res.status(200).json({
      status: "success",
      period: updatedPeriod,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof PeriodNotFoundError) {
      res.status(404).json({ status: "period-not-found" });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:periods:update",
        level: "error",
        message: "Prisma error during period update",
        traceId: req.traceId,
        details: { code: error, meta: error },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:periods:update",
        level: "error",
        message: "Error during period update",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
