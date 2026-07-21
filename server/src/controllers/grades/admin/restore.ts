import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../../shared/api/grades.js";

import LoggingService from "../../../services/logging.js";
import {
  GradeNotFoundError,
  restoreGradeWithRetry,
} from "../../../services/grades/restore.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.DeleteGradeRequestBody>,
  res: Response<GradesAPITypes.GradeResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { gradeId: id } = req.body;
  const userAccount = req.user!;

  try {
    const grade = await restoreGradeWithRetry(id, {
      traceId: req.traceId,
      userAccount,
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:admin:restore",
      level: "info",
      message: "Grade restored successfully",
      traceId: req.traceId,
      duration,
      details: {
        gradeId: grade.id,
        restoredBy: userAccount.id,
      },
      _references: {
        gradeId: "Grade",
        restoredBy: "Account",
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:grades:admin:restore",
        level: "error",
        message: "Prisma error during grade restoration",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:admin:restore",
        level: "error",
        message: "Error during grade restoration",
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
