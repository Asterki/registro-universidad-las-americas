import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Period,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";
type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

import LoggingService from "../../services/logging.js";

type RestorePeriodOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class PeriodNotFoundError extends Error {
  retryable = false;
  constructor(message: string) {
    super(message);
    this.name = "PeriodNotFoundError";
  }
}

export async function restorePeriod(
  periodId: string,
  options: RestorePeriodOptions = {},
): Promise<Period> {
  const startTime = performance.now();
  const userAccountId = options.userAccount?.id;

  // fetch period with metadata + updateHistory
  const existingPeriod = await prismaClient.period.findUnique({
    where: {
      id: periodId,
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

  if (!existingPeriod) {
    throw new PeriodNotFoundError(
      "Period not found or already restored",
    );
  }

  const now = new Date();

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes: {
      "metadata.deleted": false,
      "metadata.deletedAt": null,
      ...(userAccountId && { "metadata.deletedById": null }),
    },
  };

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: false,
    deletedAt: null,
    deletedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  let updatePayload: Prisma.PeriodUpdateInput;

  // Update the metadata
  if (existingPeriod.metadata) {
    updatePayload = { metadata: { update: metadataUpdatePayload } };
  } else {
    // In the unlikely case that metadata doesn't exist, create it and mark as deleted
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
          updateHistory: { create: historyEntry },
        },
      },
    };
  }

  // perform update: set metadata.deleted = true and append updateHistory
  const deleted = await prismaClient.period.update({
    where: { id: periodId },
    data: updatePayload,
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:periods:restore",
    level: "important",
    message: "Period restored",
    traceId: options.traceId,
    details: {
      periodId: String(deleted.id),
      name: deleted.name,
      ...(userAccountId !== null ? { restoredBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      periodId: "Period",
      ...(userAccountId !== null ? { restoredBy: "Account" } : {}),
    },
  });

  return deleted;
}

export async function restorePeriodWithRetry(
  periodId: string,
  options: RestorePeriodOptions = {},
): Promise<Period> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await restorePeriod(periodId, options);
      } catch (error: any) {
        if (error instanceof PeriodNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:periods:restore:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during period restoration (attempt ${attempt})`,
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