import { Request, Response, NextFunction } from "express";
import * as CourseAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";

import {
  CourseNotFoundError,
  deleteCourseWithRetry,
} from "../../services/courses/delete.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CourseAPITypes.DeleteCourseRequestBody>,
  res: Response<CourseAPITypes.DeleteCourseResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId } = req.body;
  const userAccount = req.user!;

  try {
    const deletedCourse = await deleteCourseWithRetry(courseId, {
      traceId: req.traceId,
      userAccount: userAccount,
    });

    res.status(200).json({
      status: "success",
      course: deletedCourse,
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
        source: "api:courses:delete",
        level: "error",
        message: "Prisma error during course deletion",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:delete",
        level: "error",
        message: "Error during course deletion",
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
