import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Course,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

// ---- listCoursesByPeriod ----

type ListCoursesByPeriodParameters = {
  periodId: string;
};

type ListCoursesByPeriodOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listCoursesByPeriod(
  params: ListCoursesByPeriodParameters,
  options: ListCoursesByPeriodOptions = {},
): Promise<Course[]> {
  const startTime = performance.now();

  const { periodId } = params;

  try {
    const courses = await prismaClient.course.findMany({
      where: {
        periodId,
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
      source: "services:course:list:byPeriod",
      level: "info",
      message: "Courses listed by period",
      traceId: options.traceId,
      duration,
      details: {
        periodId,
        count: courses.length,
      },
      _references: {
        periodId: "Period",
      },
    });

    return courses;
  } catch (err: any) {
    throw err;
  }
}

// ---- listCoursesByFaculty ----

type ListCoursesByFacultyParameters = {
  facultyId: string;
  periodId?: string;
};

type ListCoursesByFacultyOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listCoursesByFaculty(
  params: ListCoursesByFacultyParameters,
  options: ListCoursesByFacultyOptions = {},
): Promise<Course[]> {
  const startTime = performance.now();

  const { facultyId, periodId } = params;

  try {
    const where: Prisma.CourseWhereInput = {
      facultyId,
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    if (periodId) {
      where.periodId = periodId;
    }

    const courses = await prismaClient.course.findMany({
      where,
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
      source: "services:course:list:byFaculty",
      level: "info",
      message: "Courses listed by faculty",
      traceId: options.traceId,
      duration,
      details: {
        facultyId,
        ...(periodId ? { periodId } : {}),
        count: courses.length,
      },
      _references: {
        facultyId: "Faculty",
        ...(periodId ? { periodId: "Period" } : {}),
      },
    });

    return courses;
  } catch (err: any) {
    throw err;
  }
}

// ---- listAvailableCoursesForStudent ----

type ListAvailableCoursesForStudentParameters = {
  accountId: string;
  periodId?: string;
};

type ListAvailableCoursesForStudentOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listAvailableCoursesForStudent(
  params: ListAvailableCoursesForStudentParameters,
  options: ListAvailableCoursesForStudentOptions = {},
): Promise<Course[]> {
  const startTime = performance.now();

  const { accountId, periodId } = params;

  try {
    // find courses the student is already enrolled in (for exclusion)
    const existingEnrollments = await prismaClient.enrollment.findMany({
      where: {
        accountId,
        status: {
          in: ["active", "completed"],
        },
      },
      select: {
        courseId: true,
      },
    });

    const enrolledCourseIds = new Set(
      existingEnrollments.map((e) => e.courseId),
    );

    // build where clause for available courses
    const where: Prisma.CourseWhereInput = {
      id: {
        notIn: Array.from(enrolledCourseIds),
      },
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    if (periodId) {
      where.periodId = periodId;
    } else {
      // default to active periods
      where.period = {
        active: true,
      };
    }

    const courses = await prismaClient.course.findMany({
      where,
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

    // filter out courses that have reached max capacity
    const availableCourses = courses.filter(
      (course) => course._count.enrollments < course.maxCapacity,
    );

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:course:list:available",
      level: "info",
      message: "Available courses listed for student",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        ...(periodId ? { periodId } : {}),
        count: availableCourses.length,
      },
      _references: {
        accountId: "Account",
        ...(periodId ? { periodId: "Period" } : {}),
      },
    });

    return availableCourses;
  } catch (err: any) {
    throw err;
  }
}
