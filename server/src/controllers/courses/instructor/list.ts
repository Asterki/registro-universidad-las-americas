import { Request, Response, NextFunction } from "express";

import prismaClient from "../../../config/prisma.js";

import LoggingService from "../../../services/logging.js";
import { Prisma } from "@prisma/client";

type InstructorListCoursesBody = {
  page: number;
  count: number;
  fields?: string[];
  populate?: string[];
};

type InstructorListCoursesResponse = {
  status: string;
  courses?: any[];
  totalCourses?: number;
};

const handler = async (
  req: Request<{}, {}, InstructorListCoursesBody>,
  res: Response<InstructorListCoursesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { page, count } = req.body;
  const userAccount = req.user!;

  try {
    const where: Prisma.CourseWhereInput = {
      instructors: {
        some: {
          id: userAccount.id,
        },
      },
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    const effectivePage = page ?? 0;
    const effectiveCount = count ?? 50;

    const [courses, totalCourses] = await Promise.all([
      prismaClient.course.findMany({
        where,
        skip: effectivePage * effectiveCount,
        take: effectiveCount,
        orderBy: {
          code: "asc",
        },
      }),
      prismaClient.course.count({ where }),
    ]);

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:courses:instructor:list",
      level: "info",
      message: "Listed courses for instructor",
      traceId: req.traceId,
      duration,
      details: {
        instructorId: userAccount.id,
        total: totalCourses,
        page: effectivePage,
      },
      _references: {
        instructorId: "Account",
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
        source: "api:courses:instructor:list",
        level: "error",
        message: "Error listing instructor courses",
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
