import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Grade,
  Prisma,
} from "@prisma/client";

import LoggingService from "../logging.js";

type UpdateGradeParameters = {
  id: string;
  description?: string;
  score?: number;
};

type UpdateGradeOptions = {
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

export async function updateGrade(
  params: UpdateGradeParameters,
  options: UpdateGradeOptions = {},
): Promise<Grade> {
  const startTime = performance.now();

  const { id, description, score } = params;
  const now = new Date();

  try {
    // verify grade exists and fetch its metadata for update
    const existing = await prismaClient.grade.findUnique({
      where: { id },
      include: { metadata: true },
    });

    if (!existing) {
      throw new GradeNotFoundError();
    }

    // build update data — only provided fields
    const gradeData: any = {};
    if (description !== undefined) gradeData.description = description;
    if (score !== undefined) gradeData.score = score;

    // update the grade record directly (no new metadata)
    const grade = await prismaClient.grade.update({
      where: { id },
      data: gradeData,
    });

    // update the existing metadata's updatedAt and updatedById
    if (existing.metadataId) {
      await prismaClient.metadata.update({
        where: { id: existing.metadataId },
        data: {
          updatedAt: now,
          updatedById: options.userAccount?.id,
        },
      });
    }

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:grades:update",
      level: "info",
      message: "Grade updated successfully",
      traceId: options.traceId,
      duration,
      details: {
        gradeId: grade.id,
        description: description ?? undefined,
        score: score?.toString(),
      },
      _references: {
        gradeId: "Grade",
      },
    });

    return grade;
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

export async function updateGradeWithRetry(
  params: UpdateGradeParameters,
  options: UpdateGradeOptions = {},
): Promise<Grade> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await updateGrade(params, options);
      } catch (error: any) {
        if (error instanceof GradeNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:grades:update:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during grade update (attempt ${attempt})`,
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
