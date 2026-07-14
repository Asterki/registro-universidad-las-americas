import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Enrollment,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type GetCourseRosterParameters = {
  courseId: string;
  status?: string;
};

type GetCourseRosterOptions = {
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

type RosterEntry = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAccountNumber: string | null;
  status: string;
  finalGrade: number | null;
  registeredAt: Date;
};

export async function getCourseRoster(
  params: GetCourseRosterParameters,
  options: GetCourseRosterOptions = {},
): Promise<{
  course: { id: string; code: string; name: string; maxCapacity: number };
  roster: RosterEntry[];
  totalEnrolled: number;
}> {
  const startTime = performance.now();

  const { courseId, status } = params;

  try {
    // verify course exists
    const course = await prismaClient.course.findUnique({
      where: {
        id: courseId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        maxCapacity: true,
      },
    });

    if (!course) {
      throw new CourseNotFoundError();
    }

    // build where clause
    const where: Prisma.EnrollmentWhereInput = { courseId };

    if (status) {
      where.status = status as any;
    }

    const enrollments = await prismaClient.enrollment.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            email: true,
            accountNumber: true,
          },
        },
      },
      orderBy: {
        account: {
          name: "asc",
        },
      },
    });

    const roster: RosterEntry[] = enrollments.map((e) => ({
      enrollmentId: e.id,
      studentId: e.account.id,
      studentName: e.account.name,
      studentEmail: e.account.email,
      studentAccountNumber: e.account.accountNumber,
      status: e.status,
      finalGrade: e.finalGrade ? Number(e.finalGrade) : null,
      registeredAt: e.registeredAt,
    }));

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:course:roster",
      level: "info",
      message: "Course roster retrieved",
      traceId: options.traceId,
      duration,
      details: {
        courseId,
        totalEnrolled: roster.length,
        maxCapacity: course.maxCapacity,
        ...(status ? { statusFilter: status } : {}),
      },
      _references: {
        courseId: "Course",
      },
    });

    return {
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
        maxCapacity: course.maxCapacity,
      },
      roster,
      totalEnrolled: roster.length,
    };
  } catch (err: any) {
    if (err instanceof CourseNotFoundError) {
      throw err;
    }
    throw err;
  }
}
