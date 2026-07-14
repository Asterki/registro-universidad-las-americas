import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Prisma } from "@prisma/client";

import LoggingService from "../../services/logging.js";

type ValidateEnrollmentParameters = {
  accountId: string;
  courseId: string;
  periodId: string;
};

type ValidateEnrollmentOptions = {
  traceId?: string;
  userAccount?: Account;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

export type ValidationIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export class EnrollmentValidationError extends Error {
  retryable = false;
  constructor(message: string) {
    super(message);
    this.name = "EnrollmentValidationError";
  }
}

export async function validateEnrollment(
  params: ValidateEnrollmentParameters,
  options: ValidateEnrollmentOptions = {},
): Promise<ValidationResult> {
  const startTime = performance.now();

  const { accountId, courseId, periodId } = params;
  const issues: ValidationIssue[] = [];

  // --- 1. Check for duplicate enrollment ---
  const existingEnrollment = await prismaClient.enrollment.findUnique({
    where: {
      accountId_courseId_periodId: {
        accountId,
        courseId,
        periodId,
      },
    },
  });

  if (existingEnrollment) {
    issues.push({
      code: "DUPLICATE_ENROLLMENT",
      message: "Student is already enrolled in this course for the selected period",
      severity: "error",
    });
  }

  // --- 2. Check course exists and get capacity ---
  const course = await prismaClient.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: {
          enrollments: {
            where: {
              status: { not: "cancelled" },
            },
          },
        },
      },
      requirements: {
        include: {
          prerequisite: true,
        },
      },
    },
  });

  if (!course) {
    issues.push({
      code: "COURSE_NOT_FOUND",
      message: "Course not found",
      severity: "error",
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:enrollment:validate",
      level: "warning",
      message: "Enrollment validation completed with errors",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        courseId,
        periodId,
        issues: issues.length,
        valid: issues.every((i) => i.severity !== "error"),
      },
      _references: {
        accountId: "Account",
        courseId: "Course",
        periodId: "Period",
      },
    });

    return { valid: false, issues };
  }

  // --- 3. Check capacity ---
  if (course._count.enrollments >= course.maxCapacity) {
    issues.push({
      code: "COURSE_FULL",
      message: `Course has reached maximum capacity (${course.maxCapacity})`,
      severity: "error",
    });
  }

  // --- 4. Check period exists and is active ---
  const period = await prismaClient.period.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    issues.push({
      code: "PERIOD_NOT_FOUND",
      message: "Academic period not found",
      severity: "error",
    });
  } else if (!period.active) {
    issues.push({
      code: "PERIOD_INACTIVE",
      message: "The academic period is not active for enrollment",
      severity: "error",
    });
  }

  // --- 5. Check account academic status ---
  const account = await prismaClient.account.findUnique({
    where: { id: accountId },
    select: {
      academicStatus: true,
      accountNumber: true,
    },
  });

  if (!account) {
    issues.push({
      code: "ACCOUNT_NOT_FOUND",
      message: "Student account not found",
      severity: "error",
    });
  } else if (account.academicStatus !== "active") {
    issues.push({
      code: "INVALID_ACADEMIC_STATUS",
      message: `Student academic status is '${account.academicStatus}'. Only active students can enroll`,
      severity: "error",
    });
  }

  // --- 6. Check prerequisites ---
  if (course.requirements.length > 0) {
    const prerequisiteCourseIds = course.requirements.map(
      (r: { prerequisiteCourseId: string }) => r.prerequisiteCourseId,
    );

    const completedPrerequisites = await prismaClient.enrollment.findMany({
      where: {
        accountId,
        courseId: { in: prerequisiteCourseIds },
        status: "completed",
      },
      select: { courseId: true },
    });

    const completedSet = new Set(
      completedPrerequisites.map((e: { courseId: string }) => e.courseId),
    );

    for (const req of course.requirements) {
      if (!completedSet.has(req.prerequisiteCourseId)) {
        issues.push({
          code: "PREREQUISITE_MISSING",
          message: `Prerequisite course '${req.prerequisite.name}' has not been completed`,
          severity: "error",
        });
      }
    }
  }

  const valid = issues.every((i) => i.severity !== "error");

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:enrollment:validate",
    level: valid ? "info" : "warning",
    message: valid
      ? "Enrollment validation passed"
      : "Enrollment validation failed",
    traceId: options.traceId,
    duration,
    details: {
      accountId,
      courseId,
      periodId,
      issues: issues.length,
      valid,
    },
    _references: {
      accountId: "Account",
      courseId: "Course",
      periodId: "Period",
    },
  });

  return { valid, issues };
}

export async function validateEnrollmentWithRetry(
  params: ValidateEnrollmentParameters,
  options: ValidateEnrollmentOptions = {},
): Promise<ValidationResult> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await validateEnrollment(params, options);
      } catch (error: any) {
        if (error instanceof EnrollmentValidationError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollment:validate:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during enrollment validation (attempt ${attempt})`,
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
