import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Enrollment,
  EnrollmentStatus,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type GetAcademicHistoryParameters = {
  accountId: string;
};

type GetAcademicHistoryOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class AccountNotFoundError extends Error {
  retryable = false;
  constructor(message = "student-not-found") {
    super(message);
    this.name = "AccountNotFoundError";
  }
}

export type AcademicHistoryEnrollment = Prisma.EnrollmentGetPayload<{
  include: {
    course: {
      include: {
        faculty: true;
        period: true;
      };
    };
    period: true;
  };
}>;

export async function getAcademicHistory(
  params: GetAcademicHistoryParameters,
  options: GetAcademicHistoryOptions = {},
): Promise<AcademicHistoryEnrollment[]> {
  const startTime = performance.now();

  const { accountId } = params;

  try {
    // verify account exists
    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new AccountNotFoundError();
    }

    // return completed/failed enrollments
    const enrollments = await prismaClient.enrollment.findMany({
      where: {
        accountId,
        status: {
          in: [EnrollmentStatus.completed, EnrollmentStatus.failed],
        },
      },
      include: {
        course: {
          include: {
            faculty: true,
            period: true,
          },
        },
        period: true,
      },
      orderBy: {
        period: {
          startDate: "desc",
        },
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:academic-history:get",
      level: "info",
      message: "Academic history retrieved",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        count: enrollments.length,
      },
      _references: {
        accountId: "Account",
      },
    });

    return enrollments;
  } catch (err: any) {
    if (err instanceof AccountNotFoundError) {
      throw err;
    }
    throw err;
  }
}
