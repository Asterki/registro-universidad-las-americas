import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Enrollment, Prisma } from "@prisma/client";

import LoggingService from "../../services/logging.js";

type ListEnrollmentsByAccountParameters = {
  accountId: string;
  status?: string;
  periodId?: string;
};

type ListEnrollmentsByCourseParameters = {
  courseId: string;
  status?: string;
  accountId?: string;
};

type ListEnrollmentsOptions = {
  traceId?: string;
  userAccount?: Account;
  page?: number;
  limit?: number;
};

export type EnrollmentsListResult = {
  enrollments: Enrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export class EnrollmentListError extends Error {
  retryable = false;
  constructor(message: string) {
    super(message);
    this.name = "EnrollmentListError";
  }
}

export async function listEnrollmentsByAccount(
  params: ListEnrollmentsByAccountParameters,
  options: ListEnrollmentsOptions = {},
): Promise<EnrollmentsListResult> {
  const startTime = performance.now();

  const { accountId, status, periodId } = params;
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Record<string, any> = { accountId };

  if (status) {
    where.status = status;
  }

  if (periodId) {
    where.periodId = periodId;
  }

  try {
    const [enrollments, total] = await Promise.all([
      prismaClient.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { registeredAt: "desc" },
        select: {
          course: {
            select: {
              name: true,
              code: true,
            },
          },
          period: {
            select: {
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          status: true,
          registeredAt: true,
          cancelledAt: true,
        },
      }),
      prismaClient.enrollment.count({ where }),
    ]);

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:enrollment:list-by-account",
      level: "info",
      message: "Listed enrollments by account",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        total,
        page,
        limit,
        filters: { status, periodId },
      },
      _references: {
        accountId: "Account",
      },
    });

    return {
      enrollments: enrollments as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err: any) {
    throw err;
  }
}

export async function listEnrollmentsByCourse(
  params: ListEnrollmentsByCourseParameters,
  options: ListEnrollmentsOptions = {},
): Promise<EnrollmentsListResult> {
  const { courseId, status, accountId } = params;
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Record<string, any> = { courseId };

  if (status) {
    where.status = status;
  }

  if (accountId) {
    where.accountId = accountId;
  }

  try {
    const [enrollments, total] = await Promise.all([
      prismaClient.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { registeredAt: "desc" },
        include: {
          course: true,
          period: true,
          account: {
            select: {
              id: true,
              name: true,
              email: true,
              accountNumber: true,
            },
          },
        },
      }),
      prismaClient.enrollment.count({ where }),
    ]);

    console.log(enrollments);

    return {
      enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err: any) {
    throw err;
  }
}

export async function listEnrollmentsByAccountWithRetry(
  params: ListEnrollmentsByAccountParameters,
  options: ListEnrollmentsOptions = {},
): Promise<EnrollmentsListResult> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await listEnrollmentsByAccount(params, options);
      } catch (error: any) {
        if (error instanceof EnrollmentListError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollment:list-by-account:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during listing enrollments (attempt ${attempt})`,
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

export async function listEnrollmentsByCourseWithRetry(
  params: ListEnrollmentsByCourseParameters,
  options: ListEnrollmentsOptions = {},
): Promise<EnrollmentsListResult> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await listEnrollmentsByCourse(params, options);
      } catch (error: any) {
        if (error instanceof EnrollmentListError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollment:list-by-course:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during listing enrollments (attempt ${attempt})`,
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
