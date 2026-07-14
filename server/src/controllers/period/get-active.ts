import { Request, Response, NextFunction } from "express";

import * as PeriodAPITypes from "../../../../shared/api/period.js";

import LoggingService from "../../services/logging.js";
import { getActivePeriod, ActivePeriodNotFoundError } from "../../services/period/get-active.js";

const handler = async (
  req: Request<{}, {}, PeriodAPITypes.GetActivePeriodRequestBody>,
  res: Response<PeriodAPITypes.PeriodResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const period = await getActivePeriod({
      traceId: req.traceId,
      userAccount: req.user,
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:period:get-active",
      level: "info",
      message: "Active period retrieved successfully",
      traceId: req.traceId,
      duration,
      details: {
        periodId: period.id,
        name: period.name,
      },
    });

    res.status(200).json({
      status: "success",
      period,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof ActivePeriodNotFoundError) {
      res.status(404).json({
        status: "period-not-found",
      });
      return;
    }

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:period:get-active",
        level: "error",
        message: "Error retrieving active period",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
