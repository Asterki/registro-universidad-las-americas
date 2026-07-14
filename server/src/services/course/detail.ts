import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Course,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type GetCourseDetailParameters = {
  courseId: string;
};

type GetCourseDetailOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CourseNotFoundError extends Error {
  retryable = false;
  constructor(message = "course-not-found") {
    super(message);
    this.name = "CourseNotFoundError";
  }
}

export async function getCourseDetail(
  params: GetCourseDetailParameters,
  options: GetCourseDetailOptions = {},
): Promise<Course> {
  const startTime = performance.now();

  const { courseId } = params;

  try {
    const course = await prismaClient.course.findUnique({
      where: {
        id: courseId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      include: {
        faculty: true,
        period: true,
        instructors: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        requirements: {
          include: {
            prerequisite: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new CourseNotFoundError();
    }

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:course:detail",
      level: "info",
      message: "Course detail retrieved",
      traceId: options.traceId,
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

    return course;
  } catch (err: any) {
    if (err instanceof CourseNotFoundError) {
      throw err;
    }
    throw err;
  }
}
