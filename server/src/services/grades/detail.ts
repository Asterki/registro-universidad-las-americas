import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Grade,
  Prisma,
} from "@prisma/client";

import LoggingService from "../logging.js";

type GetGradeDetailParameters = {
  id: string;
};

type GetGradeDetailOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class GradeNotFoundError extends Error {
  retryable = false;
  constructor(message = "grade-not-found") {
    super(message);
    this.name = "GradeNotFoundError";
  }
}

type GradeDetail = Grade & {
  enrollment: {
    id: string;
    accountId: string;
    courseId: string;
    periodId: string;
    registeredAt: Date;
    status: string;
    finalGrade: any;
    account: {
      id: string;
      name: string;
      email: string;
      accountNumber: string | null;
    };
    course: {
      id: string;
      code: string;
      name: string;
      credits: number;
    };
    period?: {
      id: string;
      name: string;
    };
  };
  recordedBy: {
    id: string;
    name: string;
    email: string;
  };
};

export async function getGradeDetail(
  params: GetGradeDetailParameters,
  options: GetGradeDetailOptions = {},
): Promise<GradeDetail> {
  const startTime = performance.now();

  const { id } = params;

  try {
    const grade = await prismaClient.grade.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                email: true,
                accountNumber: true,
              },
            },
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true,
              },
            },
            period: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        metadata: true,
      },
    });

    if (!grade) {
      throw new GradeNotFoundError();
    }

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:grades:detail",
      level: "info",
      message: "Grade detail retrieved successfully",
      traceId: options.traceId,
      duration,
      details: {
        gradeId: grade.id,
        enrollmentId: grade.enrollmentId,
      },
      _references: {
        gradeId: "Grade",
        enrollmentId: "Enrollment",
      },
    });

    return grade as unknown as GradeDetail;
  } catch (err: any) {
    if (err instanceof GradeNotFoundError) {
      throw err;
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new GradeNotFoundError();
    }

    throw err;
  }
}

export async function getGradeDetailWithRetry(
  params: GetGradeDetailParameters,
  options: GetGradeDetailOptions = {},
): Promise<GradeDetail> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await getGradeDetail(params, options);
      } catch (error: any) {
        if (error instanceof GradeNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:grades:detail:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during grade detail retrieval (attempt ${attempt})`,
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
