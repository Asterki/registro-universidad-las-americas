import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  EnrollmentStatus,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type CheckPrerequisitesParameters = {
  courseId: string;
  accountId: string;
};

type CheckPrerequisitesOptions = {
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

export class AccountNotFoundError extends Error {
  retryable = false;
  constructor(message = "student-not-found") {
    super(message);
    this.name = "AccountNotFoundError";
  }
}

export type PrerequisiteCheckResult = {
  passed: boolean;
  prerequisites: Array<{
    prerequisiteCourseId: string;
    prerequisiteCode: string;
    prerequisiteName: string;
    completed: boolean;
    grade: number | null;
  }>;
};

export async function checkPrerequisites(
  params: CheckPrerequisitesParameters,
  options: CheckPrerequisitesOptions = {},
): Promise<PrerequisiteCheckResult> {
  const startTime = performance.now();

  const { courseId, accountId } = params;

  try {
    // verify course exists
    const course = await prismaClient.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new CourseNotFoundError();
    }

    // verify account exists
    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new AccountNotFoundError();
    }

    // fetch prerequisites for this course
    const prerequisites = await prismaClient.prerequisite.findMany({
      where: { courseId },
      include: {
        prerequisite: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // if no prerequisites, pass immediately
    if (prerequisites.length === 0) {
      const duration = Number((performance.now() - startTime).toFixed(3));

      LoggingService.log({
        source: "services:academic-history:prerequisites",
        level: "info",
        message: "No prerequisites required for course",
        traceId: options.traceId,
        duration,
        details: {
          courseId,
          accountId,
          passed: true,
          prerequisiteCount: 0,
        },
        _references: {
          courseId: "Course",
          accountId: "Account",
        },
      });

      return { passed: true, prerequisites: [] };
    }

    // check each prerequisite — student must have a completed enrollment
    const results = await Promise.all(
      prerequisites.map(async (prereq) => {
        const completedEnrollment = await prismaClient.enrollment.findFirst({
          where: {
            accountId,
            courseId: prereq.prerequisiteCourseId,
            status: EnrollmentStatus.completed,
          },
          select: {
            finalGrade: true,
          },
        });

        return {
          prerequisiteCourseId: prereq.prerequisiteCourseId,
          prerequisiteCode: prereq.prerequisite.code,
          prerequisiteName: prereq.prerequisite.name,
          completed: !!completedEnrollment,
          grade: completedEnrollment?.finalGrade
            ? Number(completedEnrollment.finalGrade)
            : null,
        };
      }),
    );

    const passed = results.every((r) => r.completed);

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:academic-history:prerequisites",
      level: passed ? "info" : "warning",
      message: passed
        ? "All prerequisites met"
        : "Some prerequisites not met",
      traceId: options.traceId,
      duration,
      details: {
        courseId,
        accountId,
        passed,
        prerequisiteCount: prerequisites.length,
        metCount: results.filter((r) => r.completed).length,
      },
      _references: {
        courseId: "Course",
        accountId: "Account",
      },
    });

    return {
      passed,
      prerequisites: results,
    };
  } catch (err: any) {
    if (
      err instanceof CourseNotFoundError ||
      err instanceof AccountNotFoundError
    ) {
      throw err;
    }
    throw err;
  }
}
