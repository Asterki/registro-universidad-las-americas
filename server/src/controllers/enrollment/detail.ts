import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../shared/api/enrollment.js";

import LoggingService from "../../services/logging.js";
import {
  EnrollmentNotFoundError,
  getEnrollmentDetailWithRetry,
} from "../../services/enrollment/detail.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, EnrollmentAPITypes.GetEnrollmentDetailRequestBody>,
  res: Response<EnrollmentAPITypes.EnrollmentDetailResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { enrollmentId } = req.body;
  const userAccount = req.user!;

  try {
    const enrollment = await getEnrollmentDetailWithRetry(
      { enrollmentId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollment:detail",
      level: "info",
      message: "Retrieved enrollment detail",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentId,
        requestedBy: userAccount.id,
      },
      _references: {
        enrollmentId: "Enrollment",
        requestedBy: "Account",
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

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollment:detail",
        level: "error",
        message: "Error retrieving enrollment detail",
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
