import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../shared/api/enrollment.js";

import LoggingService from "../../services/logging.js";
import { listEnrollmentsByCourseWithRetry } from "../../services/enrollment/list.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, EnrollmentAPITypes.ListCourseEnrollmentsRequestBody>,
  res: Response<EnrollmentAPITypes.ListEnrollmentsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId, status, accountId, page, count } = req.body;
  const userAccount = req.user!;

  try {
    const result = await listEnrollmentsByCourseWithRetry(
      { courseId, status, accountId },
      {
        traceId: req.traceId,
        userAccount,
        page: page ?? 1,
        limit: count ?? 50,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollment:list-course",
      level: "info",
      message: "Listed enrollments for course",
      traceId: req.traceId,
      duration,
      details: {
        courseId,
        total: result.total,
        page: result.page,
        requestedBy: userAccount.id,
      },
      _references: {
        courseId: "Course",
        requestedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      enrollments: result.enrollments,
      total: result.total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollment:list-course",
        level: "error",
        message: "Error listing course enrollments",
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
