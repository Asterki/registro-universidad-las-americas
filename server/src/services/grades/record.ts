import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Grade,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";

import LoggingService from "../logging.js";

type RecordGradeParameters = {
  enrollmentId: string;
  description: string;
  score: number;
  date: Date;
};

type RecordGradeOptions = {
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

export class EnrollmentNotFoundError extends Error {
  retryable = false;
  constructor(message = "enrollment-not-found") {
    super(message);
    this.name = "EnrollmentNotFoundError";
  }
}

export async function recordGrade(
  params: RecordGradeParameters,
  options: RecordGradeOptions = {},
): Promise<Grade> {
  const startTime = performance.now();

  const { enrollmentId, description, score, date } = params;
  const now = new Date();
  const userAccount = options.userAccount;

  try {
    // verify enrollment exists
    const enrollment = await prismaClient.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new EnrollmentNotFoundError();
    }

    // create metadata first
    const metadata = await prismaClient.metadata.create({
      data: {
        documentVersion: 1,
        createdAt: now,
        createdById: userAccount?.id,
        updatedAt: now,
        updatedById: userAccount?.id,
        deleted: false,
        deletedAt: null,
        deletedById: null,
        status: MetadataStatus.active,
        source: MetadataSource.manual,
        notes: "",
        tags: "",
      },
    });

    // create grade referencing metadataId
    const grade = await prismaClient.grade.create({
      data: {
        enrollmentId,
        description,
        score,
        date,
        recordedById: userAccount?.id ?? "",
        metadataId: metadata.id,
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:grades:record",
      level: "important",
      message: "Grade recorded successfully",
      traceId: options.traceId,
      duration,
      details: {
        gradeId: grade.id,
        enrollmentId,
        description,
        score: score.toString(),
      },
      _references: {
        gradeId: "Grade",
        enrollmentId: "Enrollment",
      },
    });

    return grade;
  } catch (err: any) {
    if (err instanceof EnrollmentNotFoundError) {
      throw err;
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      if ((err.meta as any)?.field_name?.includes?.("enrollmentId")) {
        throw new EnrollmentNotFoundError();
      }
    }

    throw err;
  }
}

export async function recordGradeWithRetry(
  params: RecordGradeParameters,
  options: RecordGradeOptions = {},
): Promise<Grade> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await recordGrade(params, options);
      } catch (error: any) {
        if (
          error instanceof EnrollmentNotFoundError ||
          error instanceof GradeNotFoundError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:grades:record:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during grade recording (attempt ${attempt})`,
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
