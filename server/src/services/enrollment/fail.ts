import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Enrollment, Prisma } from "@prisma/client";

import LoggingService from "../../services/logging.js";

type FailEnrollmentParameters = {
  enrollmentId: string;
};

type FailEnrollmentOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class EnrollmentNotFoundError extends Error {
  retryable = false;
  constructor(message = "enrollment-not-found") {
    super(message);
    this.name = "EnrollmentNotFoundError";
  }
}

export class EnrollmentAlreadyFailedError extends Error {
  retryable = false;
  constructor(message = "enrollment-already-failed") {
    super(message);
    this.name = "EnrollmentAlreadyFailedError";
  }
}

export class EnrollmentNotActiveError extends Error {
  retryable = false;
  constructor(message = "enrollment-not-active") {
    super(message);
    this.name = "EnrollmentNotActiveError";
  }
}

export async function failEnrollment(
  params: FailEnrollmentParameters,
  options: FailEnrollmentOptions = {},
): Promise<Enrollment> {
  const startTime = performance.now();

  const { enrollmentId } = params;

  // fetch existing enrollment
  const existing = await prismaClient.enrollment.findUnique({
    where: { id: enrollmentId },
  });

  if (!existing) {
    throw new EnrollmentNotFoundError();
  }

  if (existing.status === "failed") {
    throw new EnrollmentAlreadyFailedError();
  }

  if (existing.status === "cancelled") {
    throw new EnrollmentNotActiveError();
  }

  try {
    const enrollment = await prismaClient.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "failed",
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:enrollment:fail",
      level: "important",
      message: "Enrollment marked as failed",
      traceId: options.traceId,
      duration,
      details: {
        enrollmentId: enrollment.id,
        accountId: enrollment.accountId,
        courseId: enrollment.courseId,
      },
      _references: {
        enrollmentId: "Enrollment",
        accountId: "Account",
        courseId: "Course",
      },
    });

    return enrollment;
  } catch (err: any) {
    throw err;
  }
}

export async function failEnrollmentWithRetry(
  params: FailEnrollmentParameters,
  options: FailEnrollmentOptions = {},
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await failEnrollment(params, options);
      } catch (error: any) {
        if (
          error instanceof EnrollmentNotFoundError ||
          error instanceof EnrollmentAlreadyFailedError ||
          error instanceof EnrollmentNotActiveError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollment:fail:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during enrollment failure (attempt ${attempt})`,
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
