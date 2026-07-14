import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../shared/api/enrollment.js";

import LoggingService from "../../services/logging.js";
import {
  EnrollmentNotFoundError,
  EnrollmentAlreadyCompletedError,
  EnrollmentNotActiveError,
  completeEnrollmentWithRetry,
} from "../../services/enrollment/complete.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, EnrollmentAPITypes.CompleteEnrollmentRequestBody>,
  res: Response<EnrollmentAPITypes.EnrollmentStatusResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { enrollmentId } = req.body;
  const userAccount = req.user!;

  try {
    const enrollment = await completeEnrollmentWithRetry(
      { enrollmentId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollment:complete",
      level: "info",
      message: "Enrollment completed successfully",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentId,
        completedBy: userAccount.id,
      },
      _references: {
        enrollmentId: "Enrollment",
        completedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      enrollment,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof EnrollmentNotFoundError) {
      res.status(404).json({
        status: "enrollment-not-found",
      });
      return;
    }

    if (error instanceof EnrollmentAlreadyCompletedError) {
      res.status(409).json({
        status: "enrollment-not-found",
      });
      return;
    }

    if (error instanceof EnrollmentNotActiveError) {
      res.status(400).json({
        status: "enrollment-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:enrollment:complete",
        level: "error",
        message: "Prisma error during enrollment completion",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollment:complete",
        level: "error",
        message: "Error during enrollment completion",
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
