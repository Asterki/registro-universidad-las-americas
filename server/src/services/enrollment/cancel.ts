import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Enrollment, Prisma } from "@prisma/client";

import LoggingService from "../../services/logging.js";

type CancelEnrollmentParameters = {
  enrollmentId: string;
};

type CancelEnrollmentOptions = {
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

export class EnrollmentAlreadyCancelledError extends Error {
  retryable = false;
  constructor(message = "enrollment-already-cancelled") {
    super(message);
    this.name = "EnrollmentAlreadyCancelledError";
  }
}

export async function cancelEnrollment(
  params: CancelEnrollmentParameters,
  options: CancelEnrollmentOptions = {},
): Promise<Enrollment> {
  const startTime = performance.now();

  const { enrollmentId } = params;
  const userAccountId = options.userAccount?.id;
  const now = new Date();

  // fetch existing enrollment
  const existing = await prismaClient.enrollment.findUnique({
    where: { id: enrollmentId },
  });

  if (!existing) {
    throw new EnrollmentNotFoundError();
  }

  if (existing.status === "cancelled") {
    throw new EnrollmentAlreadyCancelledError();
  }

  try {
    const enrollment = await prismaClient.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "cancelled",
        cancelledAt: now,
        cancelledById: userAccountId,
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:enrollment:cancel",
      level: "important",
      message: "Enrollment cancelled successfully",
      traceId: options.traceId,
      duration,
      details: {
        enrollmentId: enrollment.id,
        accountId: enrollment.accountId,
        courseId: enrollment.courseId,
        cancelledBy: userAccountId,
      },
      _references: {
        enrollmentId: "Enrollment",
        accountId: "Account",
        courseId: "Course",
        cancelledBy: "Account",
      },
    });

    return enrollment;
  } catch (err: any) {
    throw err;
  }
}

export async function cancelEnrollmentWithRetry(
  params: CancelEnrollmentParameters,
  options: CancelEnrollmentOptions = {},
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await cancelEnrollment(params, options);
      } catch (error: any) {
        if (
          error instanceof EnrollmentNotFoundError ||
          error instanceof EnrollmentAlreadyCancelledError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollment:cancel:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during enrollment cancellation (attempt ${attempt})`,
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
