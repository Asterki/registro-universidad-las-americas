import { Request, Response, NextFunction } from "express";
import * as CourseAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";
import {
  CourseNotFoundError,
  updateCourseWithRetry,
} from "../../services/course/update.js";

import { Prisma } from "@prisma/client";
import prismaClient from "../../config/prisma.js";

class CodeInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CodeInUseError";
  }
}

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

const handler = async (
  req: Request<{}, {}, CourseAPITypes.UpdateCourseRequestBody>,
  res: Response<CourseAPITypes.UpdateCourseResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId, code, name, credits, schedule, classroom, maxCapacity, facultyId, periodId } =
    req.body;
  const userAccount = req.user!;

  try {
    // Verify course exists
    const existingCourse = await prismaClient.course.findFirst({
      where: {
        id: courseId,
        metadata: { is: { deleted: false } },
      },
      select: { id: true, code: true, periodId: true },
    });

    if (!existingCourse) {
      throw new CourseNotFoundError("Course not found or deleted");
    }

    // If code+periodId is changing, check for duplicates
    const effectiveCode = code ?? existingCourse.code;
    const effectivePeriodId = periodId ?? existingCourse.periodId;
    if ((code !== undefined || periodId !== undefined)) {
      const dupCheck = await prismaClient.course.findFirst({
        where: {
          code: effectiveCode,
          periodId: effectivePeriodId,
          id: { not: courseId },
          metadata: { is: { deleted: false } },
        },
        select: { id: true },
      });
      if (dupCheck) {
        throw new CodeInUseError(`A course with code ${effectiveCode} already exists in this period.`);
      }
    }

    // Verify faculty if changing
    if (facultyId !== undefined) {
      const faculty = await prismaClient.faculty.findUnique({
        where: { id: facultyId, metadata: { is: { deleted: false } } },
        select: { id: true },
      });
      if (!faculty) {
        throw new FacultyNotFoundError(`Faculty ${facultyId} not found`);
      }
    }

    // Verify period if changing
    if (periodId !== undefined) {
      const period = await prismaClient.period.findUnique({
        where: { id: periodId, metadata: { is: { deleted: false } } },
        select: { id: true },
      });
      if (!period) {
        throw new PeriodNotFoundError(`Period ${periodId} not found`);
      }
    }

    const updatedCourse = await updateCourseWithRetry(
      {
        courseId,
        code,
        name,
        credits,
        schedule,
        classroom,
        maxCapacity,
        facultyId,
        periodId,
      },
      {
        traceId: req.traceId,
        userAccount: userAccount,
      },
    );

    const duration = performance.now() - start;
    LoggingService.log({
      source: "api:courses:update",
      level: "info",
      message: "Course updated successfully",
      traceId: req.traceId,
      duration,
      details: {
        updatedById: userAccount.id,
        course: updatedCourse.id,
      },
      _references: {
        updatedById: "Account",
        course: "Course",
      },
    });

    res.status(200).json({
      status: "success",
      course: updatedCourse,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CourseNotFoundError) {
      res.status(404).json({ status: "course-not-found" });
      return;
    }

    if (error instanceof CodeInUseError) {
      res.status(409).json({ status: "course-code-exists" });
      return;
    }

    if (error instanceof FacultyNotFoundError) {
      res.status(404).json({ status: "faculty-not-found" });
      return;
    }

    if (error instanceof PeriodNotFoundError) {
      res.status(404).json({ status: "period-not-found" });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:courses:update",
        level: "error",
        message: "Prisma error during course update",
        traceId: req.traceId,
        details: { code: error, meta: error },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:update",
        level: "error",
        message: "Error during course update",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
