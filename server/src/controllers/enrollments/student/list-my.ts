import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../../shared/api/enrollment.js";

import LoggingService from "../../../services/logging.js";
import prismaClient from "../../../config/prisma.js";

import { Prisma } from "@prisma/client";

type EnrollmentSelect = Prisma.EnrollmentSelect;
type EnrollmentInclude = Prisma.EnrollmentInclude;

import { getFieldsToPopulate, getFieldsToSelect } from "../../../utils/prisma.js";

const handler = async (
  req: Request<{}, {}, EnrollmentAPITypes.ListMyEnrollmentsRequestBody>,
  res: Response<EnrollmentAPITypes.ListEnrollmentsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { status, periodId, page, count } = req.body;
  const userAccount = req.user!;

  try {
    const where: Prisma.EnrollmentWhereInput = {
      accountId: userAccount.id,
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    if (status !== undefined) {
      where.status = status;
    }

    if (periodId !== undefined) {
      where.periodId = periodId;
    }

    const effectivePage = page ?? 0;
    const effectiveCount = count ?? 50;

    const [enrollments, total] = await Promise.all([
      prismaClient.enrollment.findMany({
        where,
        skip: effectivePage * effectiveCount,
        take: effectiveCount,
        orderBy: {
          registeredAt: "desc",
        },
      }),
      prismaClient.enrollment.count({ where }),
    ]);

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollments:student:list-my",
      level: "info",
      message: "Listed own enrollments",
      traceId: req.traceId,
      duration,
      details: {
        accountId: userAccount.id,
        total,
        page: effectivePage,
      },
      _references: {
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      enrollments,
      total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollments:student:list-my",
        level: "error",
        message: "Error listing own enrollments",
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
