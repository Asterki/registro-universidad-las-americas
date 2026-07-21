import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Enrollment,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";
type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

import LoggingService from "../../services/logging.js";

type DeleteEnrollmentOptions = {
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

export async function deleteEnrollment(
  enrollmentId: string,
  options: DeleteEnrollmentOptions = {},
): Promise<Enrollment> {
  const startTime = performance.now();
  const userAccountId = options.userAccount?.id;

  const existingEnrollment = await prismaClient.enrollment.findUnique({
    where: {
      id: enrollmentId,
      metadata: {
        is: {
          deleted: false,
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

  if (!existingEnrollment) {
    throw new EnrollmentNotFoundError(
      "Enrollment not found or already deleted",
    );
  }

  const now = new Date();

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes: {
      "metadata.deleted": true,
      "metadata.deletedAt": now.toISOString(),
      ...(userAccountId && { "metadata.deletedById": userAccountId }),
    },
  };
  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: true,
    deletedAt: now,
    deletedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  let updatePayload: Prisma.EnrollmentUpdateInput;

  if (existingEnrollment.metadata) {
    updatePayload = { metadata: { update: metadataUpdatePayload } };
  } else {
    updatePayload = {
      metadata: {
        create: {
          documentVersion: 1,
          createdAt: now,
          createdById: userAccountId ?? null,
          updatedAt: now,
          updatedById: userAccountId ?? null,
          deleted: true,
          deletedAt: now,
          deletedById: userAccountId ?? null,
          status: MetadataStatus.active,
          source: MetadataSource.manual,
          notes: "",
          tags: "",
          updateHistory: { create: historyEntry },
        },
      },
    };
  }

  const deleted = await prismaClient.enrollment.update({
    where: { id: enrollmentId },
    data: updatePayload,
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:enrollment:delete",
    level: "important",
    message: "Enrollment deleted",
    traceId: options.traceId,
    details: {
      enrollmentId: String(deleted.id),
      accountId: deleted.accountId,
      ...(userAccountId !== null ? { deletedBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      enrollmentId: "Enrollment",
      ...(userAccountId !== null ? { deletedBy: "Account" } : {}),
    },
  });

  return deleted;
}

export async function deleteEnrollmentWithRetry(
  enrollmentId: string,
  options: DeleteEnrollmentOptions = {},
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await deleteEnrollment(enrollmentId, options);
      } catch (error: any) {
        if (error instanceof EnrollmentNotFoundError) {
          bail(error);
          return undefined as never;
        }

        LoggingService.log({
          source: "services:enrollment:delete:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during enrollment deletion (attempt ${attempt})`,
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
