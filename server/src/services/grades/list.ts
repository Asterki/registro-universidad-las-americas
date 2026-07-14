import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Grade,
  Prisma,
} from "@prisma/client";

import LoggingService from "../logging.js";

type ListGradesParameters = {
  enrollmentId?: string;
  accountId?: string;
  courseId?: string;
  facultyId?: string;
};

type ListGradesOptions = {
  traceId?: string;
  userAccount?: Account;
  includeDeleted?: boolean;
};

export async function listGrades(
  params: ListGradesParameters,
  options: ListGradesOptions = {},
): Promise<Grade[]> {
  const startTime = performance.now();

  const { enrollmentId, accountId, courseId, facultyId } = params;

  try {
    // build where clause dynamically
    const where: any = {};

    if (enrollmentId) {
      where.enrollmentId = enrollmentId;
    }

    // when filtering by account/course/faculty, we need to join through enrollment
    if (accountId) {
      where.enrollment = {
        ...(where.enrollment ?? {}),
        accountId,
      };
    }

    if (courseId) {
      where.enrollment = {
        ...(where.enrollment ?? {}),
        courseId,
      };
    }

    if (facultyId) {
      where.enrollment = {
        ...(where.enrollment ?? {}),
        course: {
          facultyId,
        },
      };
    }

    // exclude soft-deleted grades by default
    if (!options.includeDeleted) {
      where.metadata = {
        ...(where.metadata ?? {}),
        deleted: false,
      };
    }

    const grades = await prismaClient.grade.findMany({
      where,
      include: {
        enrollment: {
          include: {
            account: true,
            course: true,
          },
        },
        recordedBy: true,
      },
      orderBy: { date: "desc" },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:grades:list",
      level: "info",
      message: "Grades listed successfully",
      traceId: options.traceId,
      duration,
      details: {
        count: grades.length,
        filters: {
          enrollmentId: enrollmentId ?? null,
          accountId: accountId ?? null,
          courseId: courseId ?? null,
          facultyId: facultyId ?? null,
        },
      },
    });

    return grades;
  } catch (err: any) {
    LoggingService.log({
      source: "services:grades:list",
      level: "error",
      message: "Error listing grades",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        error: err?.message,
        stack: err?.stack,
      },
    });

    throw err;
  }
}

export async function listGradesWithRetry(
  params: ListGradesParameters,
  options: ListGradesOptions = {},
): Promise<Grade[]> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await listGrades(params, options);
      } catch (error: any) {
        LoggingService.log({
          source: "services:grades:list:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during grade listing (attempt ${attempt})`,
          details: {
            error: error?.message,
            stack: error?.stack,
          },
        });

        throw error;
      }
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      factor: 2,
    },
  );
}
