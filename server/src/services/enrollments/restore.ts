import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Enrollment, Prisma } from "@prisma/client";
type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

import LoggingService from "../../services/logging.js";

type RestoreEnrollmentOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class EnrollmentNotFoundError extends Error {
  retryable = false;
  constructor(message: string) {
    super(message);
    this.name = "EnrollmentNotFoundError";
  }
}

export async function restoreEnrollment(
  enrollmentId: string,
  options: RestoreEnrollmentOptions = {},
): Promise<Enrollment> {
  const startTime = performance.now();
  const userAccountId = options.userAccount?.id;

  const existingEnrollment = await prismaClient.enrollment.findUnique({
    where: {
      id: enrollmentId,
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

  if (!existingEnrollment || !existingEnrollment.metadata) {
    throw new EnrollmentNotFoundError(
      "Enrollment not found or already restored",
    );
  }

  const now = new Date();

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes: {
      "metadata.deleted": false,
      "metadata.deletedAt": null,
      "metadata.deletedById": null,
    },
  };

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: false,
    deletedAt: null,
    deletedBy: { disconnect: true },
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  const restored = await prismaClient.enrollment.update({
    where: { id: enrollmentId },
    data: { metadata: { update: metadataUpdatePayload } },
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:enrollment:restore",
    level: "important",
    message: "Enrollment restored",
    traceId: options.traceId,
    details: {
      enrollmentId: String(restored.id),
      accountId: restored.accountId,
      ...(userAccountId ? { restoredBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      enrollmentId: "Enrollment",
      ...(userAccountId ? { restoredBy: "Account" } : {}),
    },
  });

  return restored;
}

export async function restoreEnrollmentWithRetry(
  enrollmentId: string,
  options: RestoreEnrollmentOptions = {},
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await restoreEnrollment(enrollmentId, options);
      } catch (error: any) {
        if (error instanceof EnrollmentNotFoundError) {
          bail(error);
          return undefined as never;
        }

        LoggingService.log({
          source: "services:enrollment:restore:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during enrollment restoration (attempt ${attempt})`,
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
