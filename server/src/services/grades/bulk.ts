import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";

import LoggingService from "../logging.js";

type BulkGradeEntry = {
  enrollmentId: string;
  description: string;
  score: number;
  date: Date;
};

type BulkRecordGradesParameters = {
  grades: BulkGradeEntry[];
};

type BulkRecordGradesOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class BulkGradeResult {
  created: number = 0;
  failed: number = 0;
  errors: { index: number; enrollmentId: string; message: string }[] = [];

  get total(): number {
    return this.created + this.failed;
  }
}

export class EnrollmentNotFoundError extends Error {
  retryable = false;
  constructor(message = "enrollment-not-found") {
    super(message);
    this.name = "EnrollmentNotFoundError";
  }
}

export async function bulkRecordGrades(
  params: BulkRecordGradesParameters,
  options: BulkRecordGradesOptions = {},
): Promise<BulkGradeResult> {
  const startTime = performance.now();

  const { grades } = params;
  const now = new Date();
  const userAccount = options.userAccount;
  const result = new BulkGradeResult();

  for (let i = 0; i < grades.length; i++) {
    const entry = grades[i];

    try {
      // verify enrollment exists
      const enrollment = await prismaClient.enrollment.findUnique({
        where: { id: entry.enrollmentId },
      });

      if (!enrollment) {
        result.failed++;
        result.errors.push({
          index: i,
          enrollmentId: entry.enrollmentId,
          message: "enrollment-not-found",
        });
        continue;
      }

      // create metadata for this grade
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

      // create the grade
      await prismaClient.grade.create({
        data: {
          enrollmentId: entry.enrollmentId,
          description: entry.description,
          score: entry.score,
          date: entry.date,
          recordedById: userAccount?.id ?? "",
          metadataId: metadata.id,
        },
      });

      result.created++;
    } catch (err: any) {
      result.failed++;
      result.errors.push({
        index: i,
        enrollmentId: entry.enrollmentId,
        message: err?.message ?? "unknown-error",
      });
    }
  }

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:grades:bulk",
    level: "important",
    message: `Bulk grade recording completed: ${result.created} created, ${result.failed} failed`,
    traceId: options.traceId,
    duration,
    details: {
      total: grades.length,
      created: result.created,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    },
    _references: {
      enrollmentId: "Enrollment",
    },
  });

  return result;
}

export async function bulkRecordGradesWithRetry(
  params: BulkRecordGradesParameters,
  options: BulkRecordGradesOptions = {},
): Promise<BulkGradeResult> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await bulkRecordGrades(params, options);
      } catch (error: any) {
        LoggingService.log({
          source: "services:grades:bulk:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during bulk grade recording (attempt ${attempt})`,
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
