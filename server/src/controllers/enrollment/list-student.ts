import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../shared/api/enrollment.js";

import LoggingService from "../../services/logging.js";
import { listEnrollmentsByAccountWithRetry } from "../../services/enrollment/list.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, EnrollmentAPITypes.ListStudentEnrollmentsRequestBody>,
  res: Response<EnrollmentAPITypes.ListEnrollmentsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { accountId, status, periodId, page, count } = req.body;
  const userAccount = req.user!;

  try {
    const result = await listEnrollmentsByAccountWithRetry(
      { accountId, status, periodId },
      {
        traceId: req.traceId,
        userAccount,
        page: page ?? 1,
        limit: count ?? 50,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollment:list-student",
      level: "info",
      message: "Listed enrollments for student",
      traceId: req.traceId,
      duration,
      details: {
        accountId,
        total: result.total,
        page: result.page,
        requestedBy: userAccount.id,
      },
      _references: {
        accountId: "Account",
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
        source: "api:enrollment:list-student",
        level: "error",
        message: "Error listing student enrollments",
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
