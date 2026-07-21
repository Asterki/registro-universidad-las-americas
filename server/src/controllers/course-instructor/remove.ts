import { Request, Response, NextFunction } from "express";

import * as CourseInstructorAPITypes from "../../../../shared/api/course-instructor.js";

import LoggingService from "../../services/logging.js";
import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

class CourseInstructorNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CourseInstructorNotFoundError";
  }
}

const handler = async (
  req: Request<{}, {}, CourseInstructorAPITypes.RemoveInstructorRequestBody>,
  res: Response<CourseInstructorAPITypes.CourseInstructorResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId, accountId } = req.body;
  const userAccount = req.user!;

  try {
    // Check if the course exists and instructor is assigned
    const course = await prismaClient.course.findUnique({
      where: { id: courseId },
      include: { instructors: { where: { id: accountId }, select: { id: true } } },
    });

    if (!course || course.instructors.length === 0) {
      throw new CourseInstructorNotFoundError("Instructor not assigned to course");
    }

    // Remove instructor from course
    await prismaClient.course.update({
      where: { id: courseId },
      data: {
        instructors: {
          disconnect: { id: accountId },
        },
      },
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:course-instructor:remove",
      level: "important",
      message: "Instructor removed from course",
      traceId: req.traceId,
      duration,
      details: {
        courseId,
        accountId,
      },
      _references: {
        courseId: "Course",
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
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
