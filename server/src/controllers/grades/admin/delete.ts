import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../../shared/api/grades.js";

import LoggingService from "../../../services/logging.js";
import {
  GradeNotFoundError,
  deleteGradeWithRetry,
} from "../../../services/grades/delete.js";

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
    const result = await deleteGradeWithRetry(
      { id },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:admin:delete",
      level: "info",
      message: "Grade deleted by admin successfully",
      traceId: req.traceId,
      duration,
      details: {
        gradeId: id,
        deletedBy: userAccount.id,
      },
      _references: {
        gradeId: "Grade",
        deletedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      grade: { id: result.id, deleted: result.deleted },
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
        source: "api:grades:admin:delete",
        level: "error",
        message: "Prisma error during grade deletion by admin",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:admin:delete",
        level: "error",
        message: "Error during grade deletion by admin",
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
