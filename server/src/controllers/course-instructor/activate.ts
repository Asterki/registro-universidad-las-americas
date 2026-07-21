import { Request, Response, NextFunction } from "express";

import * as CourseInstructorAPITypes from "../../../../shared/api/course-instructor.js";

import LoggingService from "../../services/logging.js";
import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

class AssignmentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssignmentNotFoundError";
  }
}

const handler = async (
  req: Request<{}, {}, CourseInstructorAPITypes.ActivateInstructorAssignmentRequestBody>,
  res: Response<CourseInstructorAPITypes.CourseInstructorResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId, accountId } = req.body;
  const userAccount = req.user!;

  try {
    // Verify the course exists and instructor is assigned
    const course = await prismaClient.course.findUnique({
      where: { id: courseId },
      include: { instructors: { where: { id: accountId }, select: { id: true } } },
    });

    if (!course) {
      throw new AssignmentNotFoundError("Course not found");
    }

    if (course.instructors.length === 0) {
      throw new AssignmentNotFoundError("Instructor not assigned to this course");
    }

    // Already active — this is a no-op in the implicit relation since
    // there's no separate activation state. Just return success.
    const updatedCourse = await prismaClient.course.findUnique({
      where: { id: courseId },
      include: { instructors: true },
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:course-instructor:activate",
      level: "important",
      message: "Course instructor assignment activated",
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
      course: updatedCourse!,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof AssignmentNotFoundError) {
      res.status(404).json({
        status: "assignment-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:course-instructor:activate",
        level: "error",
        message: "Prisma error during assignment activation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:course-instructor:activate",
        level: "error",
        message: "Error during assignment activation",
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
