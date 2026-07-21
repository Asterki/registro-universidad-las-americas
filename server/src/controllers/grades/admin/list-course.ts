import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../../shared/api/grades.js";

import prismaClient from "../../../config/prisma.js";
import LoggingService from "../../../services/logging.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.ListCourseGradesRequestBody>,
  res: Response<GradesAPITypes.ListGradesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId, page = 0, count = 20 } = req.body;
  const userAccount = req.user!;

  try {
    const where: Prisma.GradeWhereInput = {
      enrollment: {
        courseId,
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
      source: "api:grades:admin:list-course",
      level: "info",
      message: "Listed grades for course (admin)",
      traceId: req.traceId,
      duration,
      details: {
        courseId,
        count: grades.length,
        total,
        requestedBy: userAccount.id,
      },
      _references: {
        courseId: "Course",
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
        source: "api:grades:admin:list-course",
        level: "error",
        message: "Error listing course grades",
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
