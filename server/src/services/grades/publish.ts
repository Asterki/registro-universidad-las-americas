import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Enrollment,
  Prisma,
} from "@prisma/client";

import LoggingService from "../logging.js";

type PublishFinalGradeParameters = {
  enrollmentId: string;
};

type PublishFinalGradeOptions = {
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

export class NoGradesFoundError extends Error {
  retryable = false;
  constructor(message = "no-grades-found-for-enrollment") {
    super(message);
    this.name = "NoGradesFoundError";
  }
}

export async function publishFinalGrade(
  params: PublishFinalGradeParameters,
  options: PublishFinalGradeOptions = {},
): Promise<Enrollment> {
  const startTime = performance.now();

  const { enrollmentId } = params;

  try {
    // verify enrollment exists
    const enrollment = await prismaClient.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new EnrollmentNotFoundError();
    }

    // aggregate all active (non-deleted) grades for this enrollment
    const grades: { score: any }[] = await prismaClient.grade.findMany({
      where: {
        enrollmentId,
        metadata: {
          deleted: false,
        },
      },
      select: {
        score: true,
      },
    });

    if (grades.length === 0) {
      throw new NoGradesFoundError();
    }

    // calculate average
    const total = grades.reduce(
      (sum: number, g) => sum + Number(g.score),
      0,
    );
    const average = total / grades.length;
    const roundedAverage = Math.round(average * 100) / 100; // 2 decimal places

    // update enrollment finalGrade
    const updated = await prismaClient.enrollment.update({
      where: { id: enrollmentId },
      data: {
        finalGrade: roundedAverage,
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:grades:publish",
      level: "important",
      message: "Final grade published successfully",
      traceId: options.traceId,
      duration,
      details: {
        enrollmentId,
        finalGrade: roundedAverage.toString(),
        gradesAveraged: grades.length,
      },
      _references: {
        enrollmentId: "Enrollment",
      },
    });

    return updated;
  } catch (err: any) {
    if (
      err instanceof EnrollmentNotFoundError ||
      err instanceof NoGradesFoundError
    ) {
      throw err;
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new EnrollmentNotFoundError();
    }

    throw err;
  }
}

export async function publishFinalGradeWithRetry(
  params: PublishFinalGradeParameters,
  options: PublishFinalGradeOptions = {},
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await publishFinalGrade(params, options);
      } catch (error: any) {
        if (
          error instanceof EnrollmentNotFoundError ||
          error instanceof NoGradesFoundError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:grades:publish:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during final grade publishing (attempt ${attempt})`,
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
