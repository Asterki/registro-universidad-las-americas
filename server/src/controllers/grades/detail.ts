import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../shared/api/grades.js";

import LoggingService from "../../services/logging.js";
import {
  GradeNotFoundError,
  getGradeDetailWithRetry,
} from "../../services/grades/detail.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.GetGradeDetailRequestBody>,
  res: Response<GradesAPITypes.GradeDetailResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { gradeId: id } = req.body;
  const userAccount = req.user!;

  try {
    const grade = await getGradeDetailWithRetry(
      { id },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:detail",
      level: "info",
      message: "Grade detail retrieved successfully",
      traceId: req.traceId,
      duration,
      details: {
        gradeId: id,
        requestedBy: userAccount.id,
      },
      _references: {
        gradeId: "Grade",
        requestedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      grade,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof GradeNotFoundError) {
      res.status(404).json({
        status: "grade-not-found",
      });
      return;
    }

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:detail",
        level: "error",
        message: "Error retrieving grade detail",
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
