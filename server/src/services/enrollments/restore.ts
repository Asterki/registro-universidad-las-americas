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

type RestoreEnrollmentOptions = {
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

  if (!existingEnrollment) {
    throw new EnrollmentNotFoundError(
      "Enrollment not found or already restored",
    );
  }

  const now = new Date();

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId
      ? {
          connect: {
            id: userAccountId,
          },
        }
      : undefined,
    changes: {
      "metadata.deleted": false,
      "metadata.deletedAt": null,
      ...(userAccountId && {
        "metadata.deletedById": null,
      }),
    },
  };

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: false,
    deletedAt: null,
    deletedBy: userAccountId
      ? {
          connect: {
            id: userAccountId,
          },
        }
      : undefined,
    updatedAt: now,
    updatedBy: userAccountId
      ? {
          connect: {
            id: userAccountId,
          },
        }
      : undefined,
    updateHistory: {
      create: historyEntry,
    },
  };

  let updatePayload: Prisma.EnrollmentUpdateInput;

  if (existingEnrollment.metadata) {
    updatePayload = {
      metadata: {
        update: metadataUpdatePayload,
      },
    };
  } else {
    updatePayload = {
      metadata: {
        create: {
          documentVersion: 1,
          createdAt: now,
          createdById: userAccountId ?? null,
          updatedAt: now,
          updatedById: userAccountId ?? null,
          deleted: false,
          deletedAt: null,
          deletedById: userAccountId ?? null,
          status: MetadataStatus.active,
          source: MetadataSource.manual,
          notes: "",
          tags: "",
          updateHistory: {
            create: historyEntry,
          },
        },
      },
    };
  }
    const restored = await prismaClient.enrollment.update({
    where: {
      id: enrollmentId,
    },
    data: updatePayload,
    include: {
      metadata: {
        include: {
          updateHistory: true,
        },
      },
    },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:enrollments:restore",
    level: "important",
    message: "Enrollment restored",
    traceId: options.traceId,
    details: {
      enrollmentId: String(restored.id),
      ...(userAccountId != null
        ? {
            restoredBy: String(userAccountId),
          }
        : {}),
    },
    duration: durationMs,
    _references: {
      enrollmentId: "Enrollment",
      ...(userAccountId != null
        ? {
            restoredBy: "Account",
          }
        : {}),
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
        }

        LoggingService.log({
          source: "services:enrollments:restore:retry",
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