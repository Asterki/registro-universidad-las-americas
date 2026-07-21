import { performance } from "perf_hooks";
import retry from "async-retry";

import {
  Account,
  Enrollment,
  EnrollmentStatus,
  MetadataSource,
  MetadataStatus,
  MetadataUpdateHistory,
  Prisma,
} from "@prisma/client";
import prismaClient from "../../config/prisma.js";

import LoggingService from "../../services/logging.js";

type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;
type MetadataUpdateInput = Prisma.MetadataUpdateInput;

type UpdateEnrollmentParameters = {
  enrollmentId: string;
  status?: EnrollmentStatus;
  finalGrade?: number;
  cancelledAt?: Date;
  cancelledById?: string;
};

type UpdateEnrollmentOptions = {
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

export async function updateEnrollment(
  params: UpdateEnrollmentParameters,
  options: UpdateEnrollmentOptions,
): Promise<Enrollment> {
  const startTime = performance.now();
  const now = new Date();

  const { enrollmentId, status, finalGrade, cancelledAt, cancelledById } =
    params;
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
      metadata: { include: { updateHistory: true } },
    },
  });

  if (!existingEnrollment) {
    throw new EnrollmentNotFoundError("Enrollment not found or deleted");
  }

  const changes: MetadataUpdateHistory["changes"] = {};
  const updatePayload: Prisma.EnrollmentUpdateInput = {};

  if (status !== undefined) {
    changes.status = status;
    updatePayload.status = status;
  }
  if (finalGrade !== undefined) {
    changes.finalGrade = finalGrade;
    updatePayload.finalGrade = finalGrade;
  }
  if (cancelledAt !== undefined) {
    changes.cancelledAt = cancelledAt.toISOString();
    updatePayload.cancelledAt = cancelledAt;
  }
  if (cancelledById !== undefined) {
    changes.cancelledById = cancelledById;
    updatePayload.cancelledBy = { connect: { id: cancelledById } };
  }

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes,
  };

  const metadataUpdatePayload: MetadataUpdateInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: {
      create: historyEntry,
    },
  };

  if (existingEnrollment.metadata) {
    updatePayload.metadata = { update: metadataUpdatePayload };
  } else {
    updatePayload.metadata = {
      create: {
        documentVersion: 1,
        createdAt: now,
        createdById: userAccountId,
        updatedAt: now,
        updatedById: userAccountId,
        deleted: false,
        deletedAt: null,
        deletedById: null,
        status: MetadataStatus.active,
        source: MetadataSource.manual,
        notes: "",
        tags: "",
        updateHistory: { create: historyEntry },
      },
    };
  }

  try {
    const updated = await prismaClient.enrollment.update({
      where: { id: enrollmentId },
      data: updatePayload,
      include: { metadata: { include: { updateHistory: true } } },
    });

    LoggingService.log({
      source: "services:enrollment:update",
      level: "important",
      message: "Enrollment updated",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        enrollmentId: updated.id,
        ...(userAccountId ? { updatedBy: userAccountId } : {}),
      },
      _references: {
        enrollmentId: "Enrollment",
        ...(userAccountId ? { updatedBy: "Account" } : {}),
      },
    });

    return updated;
  } catch (err: any) {
    throw err;
  }
}

export async function updateEnrollmentWithRetry(
  params: UpdateEnrollmentParameters,
  options: UpdateEnrollmentOptions,
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await updateEnrollment(params, options);
      } catch (error: any) {
        if (error instanceof EnrollmentNotFoundError) {
          bail(error);
          return undefined as never;
        }

        LoggingService.log({
          source: "services:enrollment:update:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during enrollment update (attempt ${attempt})`,
          details: { error: error?.message, stack: error?.stack },
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
