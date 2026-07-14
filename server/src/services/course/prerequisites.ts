import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
  Prerequisite,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type GetCoursePrerequisitesParameters = {
  courseId: string;
};

type GetCoursePrerequisitesOptions = {
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

export async function getCoursePrerequisites(
  params: GetCoursePrerequisitesParameters,
  options: GetCoursePrerequisitesOptions = {},
): Promise<Prerequisite[]> {
  const startTime = performance.now();

  const { courseId } = params;

  try {
    // verify course exists
    const course = await prismaClient.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new CourseNotFoundError();
    }

    const prerequisites = await prismaClient.prerequisite.findMany({
      where: { courseId },
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
      orderBy: {
        prerequisite: {
          code: "asc",
        },
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:course:prerequisites",
      level: "info",
      message: "Course prerequisites retrieved",
      traceId: options.traceId,
      duration,
      details: {
        courseId,
        prerequisiteCount: prerequisites.length,
      },
      _references: {
        courseId: "Course",
      },
    });

    return prerequisites;
  } catch (err: any) {
    if (err instanceof CourseNotFoundError) {
      throw err;
    }
    throw err;
  }
}
