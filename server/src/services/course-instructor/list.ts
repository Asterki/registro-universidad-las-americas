import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  CourseInstructor,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

// ---- listCourseInstructors ----

type ListCourseInstructorsParameters = {
  courseId: string;
};

type ListCourseInstructorsOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listCourseInstructors(
  params: ListCourseInstructorsParameters,
  options: ListCourseInstructorsOptions = {},
): Promise<CourseInstructor[]> {
  const startTime = performance.now();

  const { courseId } = params;

  try {
    const instructors = await prismaClient.courseInstructor.findMany({
      where: {
        courseId,
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
            specialty: true,
            contractType: true,
          },
        },
      },
      orderBy: {
        account: {
          name: "asc",
        },
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:course-instructor:list:byCourse",
      level: "info",
      message: "Course instructors listed",
      traceId: options.traceId,
      duration,
      details: {
        courseId,
        count: instructors.length,
      },
      _references: {
        courseId: "Course",
      },
    });

    return instructors;
  } catch (err: any) {
    throw err;
  }
}

// ---- listInstructorCourses ----

type ListInstructorCoursesParameters = {
  accountId: string;
};

type ListInstructorCoursesOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listInstructorCourses(
  params: ListInstructorCoursesParameters,
  options: ListInstructorCoursesOptions = {},
): Promise<CourseInstructor[]> {
  const startTime = performance.now();

  const { accountId } = params;

  try {
    const assignments = await prismaClient.courseInstructor.findMany({
      where: {
        accountId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      include: {
        course: {
          include: {
            faculty: true,
            period: true,
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: {
        course: {
          code: "asc",
        },
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:course-instructor:list:byAccount",
      level: "info",
      message: "Instructor courses listed",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        count: assignments.length,
      },
      _references: {
        accountId: "Account",
      },
    });

    return assignments;
  } catch (err: any) {
    throw err;
  }
}
