import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../shared/api/grades.js";

import LoggingService from "../../services/logging.js";
import { listGradesWithRetry } from "../../services/grades/list.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.ListMyGradesRequestBody>,
  res: Response<GradesAPITypes.ListGradesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const userAccount = req.user!;

  try {
    const grades = await listGradesWithRetry(
      { accountId: userAccount.id },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:list-my",
      level: "info",
      message: "Listed own grades",
      traceId: req.traceId,
      duration,
      details: {
        accountId: userAccount.id,
        count: grades.length,
      },
      _references: {
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      grades,
      total: grades.length,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:list-my",
        level: "error",
        message: "Error listing own grades",
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
