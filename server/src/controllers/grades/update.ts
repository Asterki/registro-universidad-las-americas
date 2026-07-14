import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../shared/api/grades.js";

import LoggingService from "../../services/logging.js";
import {
  GradeNotFoundError,
  updateGradeWithRetry,
} from "../../services/grades/update.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.UpdateGradeRequestBody>,
  res: Response<GradesAPITypes.GradeResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { gradeId: id, description, score } = req.body;
  const userAccount = req.user!;

  try {
    const grade = await updateGradeWithRetry(
      { id, description, score },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:update",
      level: "info",
      message: "Grade updated successfully",
      traceId: req.traceId,
      duration,
      details: {
        gradeId: grade.id,
        updatedBy: userAccount.id,
      },
      _references: {
        gradeId: "Grade",
        updatedBy: "Account",
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
        source: "api:grades:update",
        level: "error",
        message: "Prisma error during grade update",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:update",
        level: "error",
        message: "Error during grade update",
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
