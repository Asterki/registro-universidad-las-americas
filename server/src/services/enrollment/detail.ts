import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Enrollment, Prisma } from "@prisma/client";

import LoggingService from "../../services/logging.js";

type GetEnrollmentDetailParameters = {
  enrollmentId: string;
};

type GetEnrollmentDetailOptions = {
  traceId?: string;
  userAccount?: Account;
};

export type EnrollmentDetail = Enrollment & {
  course: {
    id: string;
    code: string;
    name: string;
    credits: number;
    schedule: string | null;
    classroom: string | null;
    maxCapacity: number;
  };
  period: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    active: boolean;
  };
  grades: Array<{
    id: string;
    description: string;
    score: number;
    date: Date;
  }>;
  account: {
    id: string;
    name: string;
    email: string;
    accountNumber: string | null;
  };
};

export class EnrollmentNotFoundError extends Error {
  retryable = false;
  constructor(message = "enrollment-not-found") {
    super(message);
    this.name = "EnrollmentNotFoundError";
  }
}

export async function getEnrollmentDetail(
  params: GetEnrollmentDetailParameters,
  options: GetEnrollmentDetailOptions = {},
): Promise<EnrollmentDetail> {
  const startTime = performance.now();

  const { enrollmentId } = params;

  const enrollment = await prismaClient.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          credits: true,
          schedule: true,
          classroom: true,
          maxCapacity: true,
        },
      },
      period: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          active: true,
        },
      },
      grades: {
        select: {
          id: true,
          description: true,
          score: true,
          date: true,
        },
        orderBy: { date: "desc" },
      },
      account: {
        select: {
          id: true,
          name: true,
          email: true,
          accountNumber: true,
        },
      },
    },
  });

  if (!enrollment) {
    throw new EnrollmentNotFoundError();
  }

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:enrollment:detail",
    level: "info",
    message: "Retrieved enrollment detail",
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

  return enrollment as unknown as EnrollmentDetail;
}

export async function getEnrollmentDetailWithRetry(
  params: GetEnrollmentDetailParameters,
  options: GetEnrollmentDetailOptions = {},
): Promise<EnrollmentDetail> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await getEnrollmentDetail(params, options);
      } catch (error: any) {
        if (error instanceof EnrollmentNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollment:detail:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during enrollment detail retrieval (attempt ${attempt})`,
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
