import { performance } from "perf_hooks";
import retry from "async-retry";

import {
  Account,
  Period,
  MetadataSource,
  MetadataStatus,
  MetadataUpdateHistory,
  Prisma,
} from "@prisma/client";
import prismaClient from "../../config/prisma.js";

import LoggingService from "../../services/logging.js";

type PeriodUpdateInput = Prisma.PeriodUpdateInput;
type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;
type MetadataUpdateInput = Prisma.MetadataUpdateInput;

type UpdatePeriodParameters = {
  periodId: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  active?: boolean;
};

type UpdatePeriodOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class PeriodNotFoundError extends Error {
  retryable = false;
  /** @param message Error message */
  constructor(message: string) {
    super(message);
    this.name = "PeriodNotFoundError";
  }
}

export class PeriodInvalidDateRangeError extends Error {
  retryable = false;
  constructor(message = "period-end-before-start") {
    super(message);
    this.name = "PeriodInvalidDateRangeError";
  }
}

export async function updatePeriod(
  params: UpdatePeriodParameters,
  options: UpdatePeriodOptions,
): Promise<Period> {
  const startTime = performance.now();
  const now = new Date();

  const { periodId, name, startDate, endDate, active } = params;
  const userAccountId = options.userAccount?.id;

  // Fetch existing period ensuring it's not deleted (metadata.deleted !== true)
  const existingPeriod = await prismaClient.period.findUnique({
    where: {
      id: periodId,
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

  if (!existingPeriod) {
    throw new PeriodNotFoundError("Period not found or deleted");
  }

  // Validate resulting date range using new values where provided, existing otherwise
  const effectiveStartDate = startDate ?? existingPeriod.startDate;
  const effectiveEndDate = endDate ?? existingPeriod.endDate;

  if (effectiveEndDate < effectiveStartDate) {
    throw new PeriodInvalidDateRangeError();
  }

  // Collect changes using external-facing keys
  const changes: MetadataUpdateHistory["changes"] = {};
  const updatePayload: Prisma.PeriodUpdateInput = {};

  // Doing it like this because otherwise we lose type safety
  if (name !== undefined) {
    changes.name = name;
    updatePayload.name = name;
  }
  if (startDate !== undefined) {
    changes.startDate = startDate.toISOString();
    updatePayload.startDate = startDate;
  }
  if (endDate !== undefined) {
    changes.endDate = endDate.toISOString();
    updatePayload.endDate = endDate;
  }
  if (active !== undefined) {
    changes.active = active;
    updatePayload.active = active;
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

  if (existingPeriod.metadata) {
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

  const updated = await prismaClient.period.update({
    where: { id: params.periodId },
    data: updatePayload,
    include: { metadata: { include: { updateHistory: true } } },
  });

  LoggingService.log({
    source: "services:periods:update",
    level: "important",
    message: "Admin updated period",
    traceId: options.traceId,
    duration: Number((performance.now() - startTime).toFixed(3)),
    details: {
      periodId: updated.id,
      updatedBy: userAccountId != null ? userAccountId : undefined,
    },
    _references: {
      periodId: "Period",
      updatedBy: "Account",
    },
  });

  return updated;
}

export async function updatePeriodWithRetry(
  params: UpdatePeriodParameters,
  options: UpdatePeriodOptions,
): Promise<Period> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await updatePeriod(params, options);
      } catch (error: any) {
        if (
          error instanceof PeriodNotFoundError ||
          error instanceof PeriodInvalidDateRangeError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:periods:update:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during period update (attempt ${attempt})`,
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