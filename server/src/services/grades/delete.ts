import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
} from "@prisma/client";

import LoggingService from "../logging.js";

type DeleteGradeParameters = {
  id: string;
};

type DeleteGradeOptions = {
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

export async function deleteGrade(
  params: DeleteGradeParameters,
  options: DeleteGradeOptions = {},
): Promise<{ id: string; deleted: boolean }> {
  const startTime = performance.now();

  const { id } = params;
  const now = new Date();
  const userAccount = options.userAccount;

  try {
    // verify grade exists and fetch its metadata
    const existing = await prismaClient.grade.findUnique({
      where: { id },
      include: { metadata: true },
    });

    if (!existing) {
      throw new GradeNotFoundError();
    }

    if (!existing.metadataId) {
      throw new GradeNotFoundError("grade-has-no-metadata");
    }

    // soft-delete via metadata
    await prismaClient.metadata.update({
      where: { id: existing.metadataId },
      data: {
        deleted: true,
        deletedAt: now,
        deletedById: userAccount?.id,
        updatedAt: now,
        updatedById: userAccount?.id,
        status: "inactive" as any,
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:grades:delete",
      level: "important",
      message: "Grade soft-deleted successfully",
      traceId: options.traceId,
      duration,
      details: {
        gradeId: id,
      },
      _references: {
        gradeId: "Grade",
      },
    });

    return { id, deleted: true };
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

export async function deleteGradeWithRetry(
  params: DeleteGradeParameters,
  options: DeleteGradeOptions = {},
): Promise<{ id: string; deleted: boolean }> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await deleteGrade(params, options);
      } catch (error: any) {
        if (error instanceof GradeNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:grades:delete:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during grade deletion (attempt ${attempt})`,
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
