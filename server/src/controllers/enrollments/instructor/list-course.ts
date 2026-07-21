import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../../shared/api/enrollment.js";

import LoggingService from "../../../services/logging.js";
import prismaClient from "../../../config/prisma.js";

import { Prisma } from "@prisma/client";

type EnrollmentSelect = Prisma.EnrollmentSelect;
type EnrollmentInclude = Prisma.EnrollmentInclude;

import { getFieldsToPopulate, getFieldsToSelect } from "../../../utils/prisma.js";

type InstructorListCourseEnrollmentsBody = {
  courseId: string;
  page: number;
  count: number;
};

const handler = async (
  req: Request<{}, {}, InstructorListCourseEnrollmentsBody>,
  res: Response<EnrollmentAPITypes.ListEnrollmentsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId, page, count } = req.body;
  const userAccount = req.user!;

  try {
    // Verify the instructor teaches this course
    const teachesCourse = await prismaClient.course.findFirst({
      where: {
        id: courseId,
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
      },
      select: { id: true },
    });

    if (!teachesCourse) {
      res.status(403).json({
        status: "forbidden",
      });
      return;
    }

    const where: Prisma.EnrollmentWhereInput = {
      courseId,
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    const effectivePage = page ?? 0;
    const effectiveCount = count ?? 50;

    const [enrollments, total] = await Promise.all([
      prismaClient.enrollment.findMany({
        where,
        skip: effectivePage * effectiveCount,
        take: effectiveCount,
        orderBy: {
          registeredAt: "desc",
        },
      }),
      prismaClient.enrollment.count({ where }),
    ]);

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollments:instructor:list-course",
      level: "info",
      message: "Listed enrollments for course (instructor)",
      traceId: req.traceId,
      duration,
      details: {
        courseId,
        total,
        page: effectivePage,
        instructorId: userAccount.id,
      },
      _references: {
        courseId: "Course",
        instructorId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      enrollments,
      total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollments:instructor:list-course",
        level: "error",
        message: "Error listing course enrollments",
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
