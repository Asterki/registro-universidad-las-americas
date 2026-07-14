import { Request, Response, NextFunction } from "express";

import * as CourseInstructorAPITypes from "../../../../shared/api/course-instructor.js";

import LoggingService from "../../services/logging.js";
import {
  removeInstructorFromCourseWithRetry,
  CourseInstructorNotFoundError,
} from "../../services/course-instructor/remove.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CourseInstructorAPITypes.RemoveInstructorRequestBody>,
  res: Response<CourseInstructorAPITypes.CourseInstructorResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseInstructorId } = req.body;
  const userAccount = req.user!;

  try {
    // Look up the assignment to get courseId and accountId
    const assignment = await prismaClient.courseInstructor.findUnique({
      where: { id: courseInstructorId },
      select: { courseId: true, accountId: true },
    });

    if (!assignment) {
      res.status(404).json({
        status: "assignment-not-found",
      });
      return;
    }

    const { courseId, accountId } = assignment;

    const deleted = await removeInstructorFromCourseWithRetry(
      { courseId, accountId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:course-instructor:remove",
      level: "important",
      message: "Instructor removed from course",
      traceId: req.traceId,
      duration,
      details: {
        courseInstructorId: deleted.id,
        courseId,
        accountId,
      },
      _references: {
        courseInstructorId: "CourseInstructor",
        courseId: "Course",
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      assignment: deleted,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CourseInstructorNotFoundError) {
      res.status(404).json({
        status: "assignment-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:course-instructor:remove",
        level: "error",
        message: "Prisma error during instructor removal",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:course-instructor:remove",
        level: "error",
        message: "Error during instructor removal",
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
