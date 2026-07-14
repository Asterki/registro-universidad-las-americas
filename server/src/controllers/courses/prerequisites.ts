import { Request, Response, NextFunction } from "express";

import * as CoursesAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";
import {
  getCoursePrerequisites,
  CourseNotFoundError,
} from "../../services/course/prerequisites.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CoursesAPITypes.GetCoursePrerequisitesRequestBody>,
  res: Response<CoursesAPITypes.CoursePrerequisitesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId } = req.body;
  const userAccount = req.user!;

  try {
    const prerequisites = await getCoursePrerequisites(
      { courseId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:courses:prerequisites",
      level: "info",
      message: "Course prerequisites retrieved",
      traceId: req.traceId,
      duration,
      details: {
        courseId,
        prerequisiteCount: prerequisites.length,
      },
      _references: {
        courseId: "Course",
      },
    });

    res.status(200).json({
      status: "success",
      prerequisites,
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
        source: "api:courses:prerequisites",
        level: "error",
        message: "Prisma error during course prerequisites retrieval",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:prerequisites",
        level: "error",
        message: "Error during course prerequisites retrieval",
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
