import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../shared/api/enrollment.js";

import LoggingService from "../../services/logging.js";
import {
  validateEnrollmentWithRetry,
} from "../../services/enrollment/validate.js";

import { Prisma } from "@prisma/client";

import prismaClient from "../../config/prisma.js";

const handler = async (
  req: Request<{}, {}, EnrollmentAPITypes.ValidateEnrollmentRequestBody>,
  res: Response<EnrollmentAPITypes.ValidateResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { accountId, courseId } = req.body;
  const userAccount = req.user!;

  try {
    // Look up the course to get the periodId
    const course = await prismaClient.course.findUnique({
      where: { id: courseId },
      select: { periodId: true },
    });

    if (!course) {
      res.status(404).json({
        status: "course-not-found",
      });
      return;
    }

    const periodId = course.periodId;

    const result = await validateEnrollmentWithRetry(
      { accountId, courseId, periodId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollment:validate",
      level: "info",
      message: result.valid
        ? "Enrollment validation passed"
        : "Enrollment validation failed",
      traceId: req.traceId,
      duration,
      details: {
        accountId,
        courseId,
        periodId,
        valid: result.valid,
        issuesCount: result.issues.length,
      },
      _references: {
        accountId: "Account",
        courseId: "Course",
        periodId: "Period",
      },
    });

    res.status(200).json({
      status: "success",
      valid: result.valid,
      reasons: result.issues.map((i) => i.message),
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollment:validate",
        level: "error",
        message: "Error during enrollment validation",
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
