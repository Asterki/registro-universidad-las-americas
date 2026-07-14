import { Request, Response, NextFunction } from "express";

import * as CourseInstructorAPITypes from "../../../../shared/api/course-instructor.js";

import LoggingService from "../../services/logging.js";
import { listInstructorCourses } from "../../services/course-instructor/list.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CourseInstructorAPITypes.ListInstructorCoursesRequestBody>,
  res: Response<CourseInstructorAPITypes.ListInstructorCoursesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { accountId } = req.body;
  const userAccount = req.user!;

  try {
    const assignments = await listInstructorCourses(
      { accountId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:course-instructor:list-instructor",
      level: "info",
      message: "Instructor courses listed",
      traceId: req.traceId,
      duration,
      details: {
        accountId,
        count: assignments.length,
      },
      _references: {
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      courses: assignments,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:course-instructor:list-instructor",
        level: "error",
        message: "Prisma error during instructor courses listing",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:course-instructor:list-instructor",
        level: "error",
        message: "Error during instructor courses listing",
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
