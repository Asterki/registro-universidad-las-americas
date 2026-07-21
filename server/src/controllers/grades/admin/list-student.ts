import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../../shared/api/grades.js";

import prismaClient from "../../../config/prisma.js";
import LoggingService from "../../../services/logging.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.ListStudentGradesRequestBody>,
  res: Response<GradesAPITypes.ListGradesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { accountId, page = 0, count = 20 } = req.body;
  const userAccount = req.user!;

  try {
    const where: Prisma.GradeWhereInput = {
      enrollment: {
        accountId,
      },
      metadata: {
        deleted: false,
      },
    };

    const [grades, total] = await Promise.all([
      prismaClient.grade.findMany({
        where,
        skip: page * count,
        take: count,
        include: {
          enrollment: {
            include: {
              account: true,
              course: true,
            },
          },
          recordedBy: true,
        },
        orderBy: { date: "desc" },
      }),
      prismaClient.grade.count({ where }),
    ]);

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:admin:list-student",
      level: "info",
      message: "Listed grades for student (admin)",
      traceId: req.traceId,
      duration,
      details: {
        accountId,
        count: grades.length,
        total,
        requestedBy: userAccount.id,
      },
      _references: {
        accountId: "Account",
        requestedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      grades,
      total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:admin:list-student",
        level: "error",
        message: "Error listing student grades",
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
