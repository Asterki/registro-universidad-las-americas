import { Request, Response, NextFunction } from "express";

import LoggingService from "../../../services/logging.js";
import prismaClient from "../../../config/prisma.js";

import { Prisma } from "@prisma/client";

type AdminGetEnrollmentsRequestBody = {
  enrollmentIds: string[];
};

type AdminGetEnrollmentsResponseData = {
  status: string;
  enrollments?: any[];
};

const handler = async (
  req: Request<{}, {}, AdminGetEnrollmentsRequestBody>,
  res: Response<AdminGetEnrollmentsResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { enrollmentIds } = req.body;

  try {
    const enrollments = await prismaClient.enrollment.findMany({
      where: {
        id: {
          in: enrollmentIds,
        },
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      include: {
        account: {
          select: { id: true, name: true, email: true },
        },
        course: {
          select: { id: true, code: true, name: true },
        },
        period: {
          select: { id: true, name: true },
        },
      },
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollments:admin:get",
      level: "info",
      message: "Retrieved enrollments by IDs",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentIds,
        count: enrollments.length,
      },
    });

    res.status(200).json({
      status: "success",
      enrollments,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollments:admin:get",
        level: "error",
        message: "Error retrieving enrollments",
        traceId: req.traceId,
        duration,
        details: {
          error: error.message,
          stack: error.stack,
          enrollmentIds,
        },
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
