import { Request, Response, NextFunction } from "express";

import * as PeriodAPITypes from "../../../../shared/api/period.js";

import LoggingService from "../../services/logging.js";
import prismaClient from "../../config/prisma.js";

const handler = async (
  req: Request<{}, {}, PeriodAPITypes.GetPeriodDetailRequestBody>,
  res: Response<PeriodAPITypes.PeriodResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { periodId } = req.body;

    const period = await prismaClient.period.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      const duration = performance.now() - start;

      LoggingService.log({
        source: "api:period:detail",
        level: "info",
        message: "Period not found",
        traceId: req.traceId,
        duration,
        details: { periodId },
      });

      res.status(404).json({
        status: "period-not-found",
      });
      return;
    }

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:period:detail",
      level: "info",
      message: "Period detail retrieved successfully",
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

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:period:detail",
        level: "error",
        message: "Error retrieving period detail",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
