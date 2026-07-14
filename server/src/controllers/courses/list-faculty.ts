import { Request, Response, NextFunction } from "express";

import * as CoursesAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";
import { listCoursesByFaculty } from "../../services/course/list.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CoursesAPITypes.ListCoursesByFacultyRequestBody>,
  res: Response<CoursesAPITypes.ListCoursesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { facultyId, periodId } = req.body;
  const userAccount = req.user!;

  try {
    const courses = await listCoursesByFaculty(
      { facultyId, periodId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:courses:list-faculty",
      level: "info",
      message: "Courses listed by faculty",
      traceId: req.traceId,
      duration,
      details: {
        facultyId,
        ...(periodId ? { periodId } : {}),
        count: courses.length,
      },
      _references: {
        facultyId: "Faculty",
        ...(periodId ? { periodId: "Period" } : {}),
      },
    });

    res.status(200).json({
      status: "success",
      courses,
      total: courses.length,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:courses:list-faculty",
        level: "error",
        message: "Prisma error during courses listing by faculty",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:list-faculty",
        level: "error",
        message: "Error during courses listing by faculty",
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
