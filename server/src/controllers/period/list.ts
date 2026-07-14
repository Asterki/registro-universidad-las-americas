import { Request, Response, NextFunction } from "express";

import * as PeriodAPITypes from "../../../../shared/api/period.js";

import LoggingService from "../../services/logging.js";
import { listPeriods } from "../../services/period/list.js";

const handler = async (
  req: Request<{}, {}, PeriodAPITypes.ListPeriodsRequestBody>,
  res: Response<PeriodAPITypes.ListPeriodsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { active, name } = req.body;

    const periods = await listPeriods(
      { active, name } as { active?: boolean; name?: string },
      {
        traceId: req.traceId,
        userAccount: req.user,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:period:list",
      level: "info",
      message: "Periods listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        count: periods.length,
      },
    });

    res.status(200).json({
      status: "success",
      periods,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:period:list",
        level: "error",
        message: "Error during period listing",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
