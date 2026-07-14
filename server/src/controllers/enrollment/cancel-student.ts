import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../shared/api/enrollment.js";

import LoggingService from "../../services/logging.js";
import {
  EnrollmentNotFoundError,
  EnrollmentAlreadyCancelledError,
  cancelEnrollmentWithRetry,
} from "../../services/enrollment/cancel.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, EnrollmentAPITypes.CancelStudentRequestBody>,
  res: Response<EnrollmentAPITypes.CancelResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { enrollmentId } = req.body;
  const userAccount = req.user!;

  try {
    const enrollment = await cancelEnrollmentWithRetry(
      { enrollmentId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollment:cancel-student",
      level: "info",
      message: "Enrollment cancelled by admin",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentId,
        cancelledBy: userAccount.id,
      },
      _references: {
        enrollmentId: "Enrollment",
        cancelledBy: "Account",
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

    if (error instanceof EnrollmentAlreadyCancelledError) {
      res.status(409).json({
        status: "already-cancelled",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:enrollment:cancel-student",
        level: "error",
        message: "Prisma error during student enrollment cancellation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollment:cancel-student",
        level: "error",
        message: "Error during student enrollment cancellation",
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
