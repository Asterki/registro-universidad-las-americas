import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../shared/api/grades.js";

import LoggingService from "../../services/logging.js";
import { listGradesWithRetry } from "../../services/grades/list.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.ListStudentGradesRequestBody>,
  res: Response<GradesAPITypes.ListGradesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { accountId } = req.body;
  const userAccount = req.user!;

  try {
    const grades = await listGradesWithRetry(
      { accountId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:list-student",
      level: "info",
      message: "Listed grades for student",
      traceId: req.traceId,
      duration,
      details: {
        accountId,
        count: grades.length,
        requestedBy: userAccount.id,
      },
      _references: {
        accountId: "Account",
        requestedBy: "Account",
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
        source: "api:grades:list-student",
        level: "error",
        message: "Error listing student grades",
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
