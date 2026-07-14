import { Request, Response, NextFunction } from "express";

import * as CoursesAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";
import { listCoursesByPeriod } from "../../services/course/list.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CoursesAPITypes.ListCoursesByPeriodRequestBody>,
  res: Response<CoursesAPITypes.ListCoursesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { periodId } = req.body;
  const userAccount = req.user!;

  try {
    const courses = await listCoursesByPeriod(
      { periodId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:courses:list-period",
      level: "info",
      message: "Courses listed by period",
      traceId: req.traceId,
      duration,
      details: {
        periodId,
        count: courses.length,
      },
      _references: {
        periodId: "Period",
      },
    });

    res.status(200).json({
      status: "success",
      courses,
      total: courses.length,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:courses:list-period",
        level: "error",
        message: "Prisma error during courses listing by period",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:list-period",
        level: "error",
        message: "Error during courses listing by period",
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
