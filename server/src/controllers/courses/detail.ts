import { Request, Response, NextFunction } from "express";

import * as CoursesAPITypes from "../../../../shared/api/courses.js";

import LoggingService from "../../services/logging.js";
import {
  getCourseDetail,
  CourseNotFoundError,
} from "../../services/course/detail.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CoursesAPITypes.GetCourseDetailRequestBody>,
  res: Response<CoursesAPITypes.CourseDetailResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId } = req.body;
  const userAccount = req.user!;

  try {
    const course = await getCourseDetail(
      { courseId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:courses:detail",
      level: "info",
      message: "Course detail retrieved",
      traceId: req.traceId,
      duration,
      details: {
        courseId,
        code: course.code,
        name: course.name,
      },
      _references: {
        courseId: "Course",
      },
    });

    res.status(200).json({
      status: "success",
      course,
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
        source: "api:courses:detail",
        level: "error",
        message: "Prisma error during course detail retrieval",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:detail",
        level: "error",
        message: "Error during course detail retrieval",
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
