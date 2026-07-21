import { Request, Response, NextFunction } from "express";

import * as CoursesAPITypes from "../../../../../shared/api/courses.js";

import prismaClient from "../../../config/prisma.js";

import LoggingService from "../../../services/logging.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CoursesAPITypes.ListAvailableCoursesForStudentRequestBody>,
  res: Response<CoursesAPITypes.ListCoursesResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const userAccount = req.user!;

  try {
    // Find the active period
    const activePeriod = await prismaClient.period.findFirst({
      where: {
        metadata: {
          is: {
            deleted: false,
          },
        },
        active: true,
      },
      select: { id: true },
    });

    if (!activePeriod) {
      res.status(200).json({
        status: "success",
        courses: [],
        totalCourses: 0,
      });
      return;
    }

    // Find courses in the active period that the student is not enrolled in
    const where: Prisma.CourseWhereInput = {
      periodId: activePeriod.id,
      metadata: {
        is: {
          deleted: false,
        },
      },
      enrollments: {
        none: {
          accountId: userAccount.id,
          metadata: {
            is: {
              deleted: false,
            },
          },
        },
      },
    };

    const [courses, totalCourses] = await Promise.all([
      prismaClient.course.findMany({
        where,
        orderBy: {
          code: "asc",
        },
      }),
      prismaClient.course.count({ where }),
    ]);

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:courses:student:list-available",
      level: "info",
      message: "Listed available courses for student",
      traceId: req.traceId,
      duration,
      details: {
        studentId: userAccount.id,
        periodId: activePeriod.id,
        total: totalCourses,
      },
      _references: {
        studentId: "Account",
        periodId: "Period",
      },
    });

    res.status(200).json({
      status: "success",
      courses,
      totalCourses,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:student:list-available",
        level: "error",
        message: "Error listing available courses",
        traceId: req.traceId,
        details: {
          error: error.message,
          stack: error.stack,
        },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
    return;
  }
};

export default handler;
