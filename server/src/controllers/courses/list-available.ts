import { Request, Response, NextFunction } from "express";

import * as CoursesAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";
import { listAvailableCoursesForStudent } from "../../services/course/list.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CoursesAPITypes.ListAvailableCoursesForStudentRequestBody>,
  res: Response<CoursesAPITypes.ListCoursesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { periodId } = req.body;
  const userAccount = req.user!;

  try {
    const courses = await listAvailableCoursesForStudent(
      { accountId: userAccount.id, periodId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:courses:list-available",
      level: "info",
      message: "Available courses listed",
      traceId: req.traceId,
      duration,
      details: {
        accountId: userAccount.id,
        ...(periodId ? { periodId } : {}),
        count: courses.length,
      },
      _references: {
        accountId: "Account",
        ...(periodId ? { periodId: "Period" } : {}),
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
        source: "api:courses:list-available",
        level: "error",
        message: "Prisma error during available courses listing",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:list-available",
        level: "error",
        message: "Error during available courses listing",
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
