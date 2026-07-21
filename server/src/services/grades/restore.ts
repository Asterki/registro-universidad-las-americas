import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Grade, Prisma } from "@prisma/client";

import LoggingService from "../logging.js";

type RestoreGradeOptions = {
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

export async function restoreGrade(
  gradeId: string,
  options: RestoreGradeOptions = {},
): Promise<Grade> {
  const startTime = performance.now();
  const userAccountId = options.userAccount?.id;

  const existingGrade = await prismaClient.grade.findUnique({
    where: {
      id: gradeId,
      metadata: {
        is: {
          deleted: true,
        },
      },
    },
    include: {
      metadata: {
        include: {
          updateHistory: true,
        },
      },
    },
  });

  if (!existingGrade || !existingGrade.metadata) {
    throw new GradeNotFoundError("Grade not found or already restored");
  }

  const now = new Date();

  await prismaClient.metadata.update({
    where: { id: existingGrade.metadataId! },
    data: {
      deleted: false,
      deletedAt: null,
      deletedById: null,
      updatedAt: now,
      updatedById: userAccountId,
    },
  });

  const restored = await prismaClient.grade.findUnique({
    where: { id: gradeId },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:grades:restore",
    level: "important",
    message: "Grade restored",
    traceId: options.traceId,
    details: {
      gradeId: String(restored!.id),
      ...(userAccountId ? { restoredBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      gradeId: "Grade",
      ...(userAccountId ? { restoredBy: "Account" } : {}),
    },
  });

  return restored!;
}

export async function restoreGradeWithRetry(
  gradeId: string,
  options: RestoreGradeOptions = {},
): Promise<Grade> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await restoreGrade(gradeId, options);
      } catch (error: any) {
        if (error instanceof GradeNotFoundError) {
          bail(error);
          return undefined as never;
        }

        LoggingService.log({
          source: "services:grades:restore:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during grade restoration (attempt ${attempt})`,
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
