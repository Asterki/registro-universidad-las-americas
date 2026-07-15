import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as CourseAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";
import { createCourseWithRetry } from "../../services/course/create.js";

import prismaClient from "../../config/prisma.js";

class FacultyNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FacultyNotFoundError";
  }
}

class PeriodNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PeriodNotFoundError";
  }
}

class CodeInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CodeInUseError";
  }
}

const handler = async (
  req: Request<{}, {}, CourseAPITypes.CreateCourseRequestBody>,
  res: Response<CourseAPITypes.CreateCourseResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { facultyId, periodId, code, name, credits, schedule, classroom, maxCapacity } = req.body;

  const userAccount = req.user!;

  try {
    // Verify faculty exists
    const faculty = await prismaClient.faculty.findUnique({
      where: { id: facultyId, metadata: { is: { deleted: false } } },
      select: { id: true },
    });
    if (!faculty) {
      throw new FacultyNotFoundError(`Faculty ${facultyId} not found`);
    }

    // Verify period exists
    const period = await prismaClient.period.findUnique({
      where: { id: periodId, metadata: { is: { deleted: false } } },
      select: { id: true },
    });
    if (!period) {
      throw new PeriodNotFoundError(`Period ${periodId} not found`);
    }

    // Check for duplicate code+period
    const existing = await prismaClient.course.findFirst({
      where: {
        code,
        periodId,
        metadata: { is: { deleted: false } },
      },
      select: { id: true },
    });
    if (existing) {
      throw new CodeInUseError(`A course with code ${code} already exists in this period.`);
    }

    const createdCourse = await createCourseWithRetry(
      {
        facultyId,
        periodId,
        code,
        name,
        credits,
        schedule,
        classroom,
        maxCapacity,
      },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:courses:create",
      level: "info",
      message: "Course created successfully",
      traceId: req.traceId,
      duration,
      details: {
        courseId: createdCourse.id,
        createdById: userAccount.id,
        code,
      },
      _references: {
        courseId: "Course",
        createdById: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      course: createdCourse,
    });
  } catch (error: unknown) {
    if (error instanceof FacultyNotFoundError) {
      res.status(404).json({ status: "faculty-not-found" });
      return;
    }
    if (error instanceof PeriodNotFoundError) {
      res.status(404).json({ status: "period-not-found" });
      return;
    }
    if (error instanceof CodeInUseError) {
      res.status(409).json({ status: "course-code-exists" });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:courses:create",
        level: "error",
        message: "Prisma error during course creation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:create",
        level: "error",
        message: "Error during course creation",
        traceId: req.traceId,
        details: {
          error: error.message,
          stack: error.stack,
        },
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
