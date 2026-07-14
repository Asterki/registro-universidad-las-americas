import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Course,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type ListCoordinatorCoursesParameters = {
  accountId: string;
};

type ListCoordinatorCoursesOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CoordinatorNotFoundError extends Error {
  retryable = false;
  constructor(message = "coordinator-not-found") {
    super(message);
    this.name = "CoordinatorNotFoundError";
  }
}

export async function listCoordinatorCourses(
  params: ListCoordinatorCoursesParameters,
  options: ListCoordinatorCoursesOptions = {},
): Promise<Course[]> {
  const startTime = performance.now();

  const { accountId } = params;

  try {
    // find the coordinator to get their faculty
    const coordinator = await prismaClient.coordinator.findUnique({
      where: { accountId },
    });

    if (!coordinator) {
      throw new CoordinatorNotFoundError();
    }

    const courses = await prismaClient.course.findMany({
      where: {
        facultyId: coordinator.facultyId,
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
          where: {
            active: true,
            metadata: {
              is: {
                deleted: false,
              },
            },
          },
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
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:coordinator:courses",
      level: "info",
      message: "Coordinator courses listed",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        facultyId: coordinator.facultyId,
        count: courses.length,
      },
      _references: {
        accountId: "Account",
        facultyId: "Faculty",
      },
    });

    return courses;
  } catch (err: any) {
    throw err;
  }
}
