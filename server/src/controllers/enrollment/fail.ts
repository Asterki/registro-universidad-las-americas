import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../shared/api/enrollment.js";

import LoggingService from "../../services/logging.js";
import {
  EnrollmentNotFoundError,
  EnrollmentAlreadyFailedError,
  EnrollmentNotActiveError,
  failEnrollmentWithRetry,
} from "../../services/enrollment/fail.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, EnrollmentAPITypes.FailEnrollmentRequestBody>,
  res: Response<EnrollmentAPITypes.EnrollmentStatusResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { enrollmentId } = req.body;
  const userAccount = req.user!;

  try {
    const enrollment = await failEnrollmentWithRetry(
      { enrollmentId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollment:fail",
      level: "info",
      message: "Enrollment marked as failed",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentId,
        failedBy: userAccount.id,
      },
      _references: {
        enrollmentId: "Enrollment",
        failedBy: "Account",
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

    if (error instanceof EnrollmentAlreadyFailedError) {
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
        source: "api:enrollment:fail",
        level: "error",
        message: "Prisma error during enrollment failure",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollment:fail",
        level: "error",
        message: "Error during enrollment failure",
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
