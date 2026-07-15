import { Request, Response, NextFunction } from "express";

import * as CoursesAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";
import {
  CourseNotFoundError,
  restoreCourseWithRetry,
} from "../../services/course/restore.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CoursesAPITypes.RestoreCourseRequestBody>,
  res: Response<CoursesAPITypes.RestoreCourseResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId } = req.body;
  const userAccount = req.user!;

  try {
    const restoredCourse = await restoreCourseWithRetry(courseId, {
      traceId: req.traceId,
      userAccount,
    });

    res.status(200).json({
      status: "success",
      course: restoredCourse,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CourseNotFoundError) {
      res.status(404).json({
        status: "course-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:courses:restore",
        level: "error",
        message: "Prisma error during course restore",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:restore",
        level: "error",
        message: "Error during course restore",
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
