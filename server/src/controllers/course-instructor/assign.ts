import { Request, Response, NextFunction } from "express";

import * as CourseInstructorAPITypes from "../../../../shared/api/course-instructor.js";

import LoggingService from "../../services/logging.js";
import {
  assignInstructorToCourseWithRetry,
  CourseInstructorExistsError,
  CourseNotFoundError,
  InstructorNotFoundError,
} from "../../services/course-instructor/assign.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CourseInstructorAPITypes.AssignInstructorRequestBody>,
  res: Response<CourseInstructorAPITypes.CourseInstructorResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId, accountId } = req.body;
  const userAccount = req.user!;

  try {
    const assignment = await assignInstructorToCourseWithRetry(
      { courseId, accountId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:course-instructor:assign",
      level: "important",
      message: "Instructor assigned to course",
      traceId: req.traceId,
      duration,
      details: {
        courseInstructorId: assignment.id,
        courseId,
        accountId,
      },
      _references: {
        courseInstructorId: "CourseInstructor",
        courseId: "Course",
        accountId: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      assignment,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CourseInstructorExistsError) {
      res.status(409).json({
        status: "already-assigned",
      });
      return;
    }

    if (error instanceof CourseNotFoundError) {
      res.status(404).json({
        status: "course-not-found",
      });
      return;
    }

    if (error instanceof InstructorNotFoundError) {
      res.status(404).json({
        status: "instructor-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:course-instructor:assign",
        level: "error",
        message: "Prisma error during instructor assignment",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:course-instructor:assign",
        level: "error",
        message: "Error during instructor assignment",
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
