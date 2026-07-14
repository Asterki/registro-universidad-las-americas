import { Request, Response, NextFunction } from "express";

import * as CoursesAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";
import {
  getCourseRoster,
  CourseNotFoundError,
} from "../../services/course/roster.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CoursesAPITypes.GetCourseRosterRequestBody>,
  res: Response<CoursesAPITypes.CourseRosterResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId } = req.body;
  const userAccount = req.user!;

  try {
    const result = await getCourseRoster(
      { courseId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:courses:roster",
      level: "info",
      message: "Course roster retrieved",
      traceId: req.traceId,
      duration,
      details: {
        courseId,
        totalEnrolled: result.totalEnrolled,
        ...(status ? { statusFilter: status } : {}),
      },
      _references: {
        courseId: "Course",
      },
    });

    res.status(200).json({
      status: "success",
      students: result.roster,
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
        source: "api:courses:roster",
        level: "error",
        message: "Prisma error during course roster retrieval",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:roster",
        level: "error",
        message: "Error during course roster retrieval",
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
