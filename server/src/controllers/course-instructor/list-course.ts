import { Request, Response, NextFunction } from "express";

import * as CourseInstructorAPITypes from "../../../../shared/api/course-instructor.js";

import LoggingService from "../../services/logging.js";
import { listCourseInstructors } from "../../services/course-instructor/list.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CourseInstructorAPITypes.ListCourseInstructorsRequestBody>,
  res: Response<CourseInstructorAPITypes.ListCourseInstructorsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId } = req.body;
  const userAccount = req.user!;

  try {
    const instructors = await listCourseInstructors(
      { courseId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:course-instructor:list-course",
      level: "info",
      message: "Course instructors listed",
      traceId: req.traceId,
      duration,
      details: {
        courseId,
        count: instructors.length,
      },
      _references: {
        courseId: "Course",
      },
    });

    res.status(200).json({
      status: "success",
      instructors,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:course-instructor:list-course",
        level: "error",
        message: "Prisma error during course instructors listing",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:course-instructor:list-course",
        level: "error",
        message: "Error during course instructors listing",
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
