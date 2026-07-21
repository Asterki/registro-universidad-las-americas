import { Request, Response, NextFunction } from "express";

import * as CourseInstructorAPITypes from "../../../../shared/api/course-instructor.js";

import LoggingService from "../../services/logging.js";
import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

class CourseNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CourseNotFoundError";
  }
}

class InstructorNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InstructorNotFoundError";
  }
}

class AlreadyAssignedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlreadyAssignedError";
  }
}

const handler = async (
  req: Request<{}, {}, CourseInstructorAPITypes.AssignInstructorRequestBody>,
  res: Response<CourseInstructorAPITypes.CourseInstructorResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId, accountId } = req.body;

  try {
    // Verify course exists
    const course = await prismaClient.course.findUnique({
      where: { id: courseId },
      include: {
        instructors: { where: { id: accountId }, select: { id: true } },
      },
    });

    if (!course) {
      throw new CourseNotFoundError("Course not found");
    }

    // Verify instructor exists and has correct role
    const instructor = await prismaClient.account.findFirst({
      where: {
        id: accountId,
      },
      select: { id: true },
    });

    if (!instructor) {
      throw new InstructorNotFoundError("Instructor not found");
    }

    // Check if already assigned
    if (course.instructors.length > 0) {
      throw new AlreadyAssignedError("Instructor already assigned to course");
    }

    // Assign instructor to course
    const updatedCourse = await prismaClient.course.update({
      where: { id: courseId },
      data: {
        instructors: {
          connect: { id: accountId },
        },
      },
      include: {
        instructors: true,
      },
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:course-instructor:assign",
      level: "important",
      message: "Instructor assigned to course",
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

    res.status(201).json({
      status: "success",
      course: updatedCourse,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof AlreadyAssignedError) {
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
