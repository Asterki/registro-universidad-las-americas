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

import LoggingService from "../../services/logging.js";

type CreatePeriodParameters = {
  name: string;
  startDate: Date;
  endDate: Date;
  active?: boolean;
};

type CreatePeriodOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class PeriodInvalidDateRangeError extends Error {
  retryable = false;
  constructor(message = "period-end-before-start") {
    super(message);
    this.name = "PeriodInvalidDateRangeError";
  }
}

export async function createPeriod(
  params: CreatePeriodParameters,
  options: CreatePeriodOptions = {},
): Promise<Period> {
  const startTime = performance.now();

  const { name, startDate, endDate, active = true } = params;

  if (endDate < startDate) {
    throw new PeriodInvalidDateRangeError();
  }

  const now = new Date();
  const userAccount = options.userAccount;

  // create metadata first
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

  // create period referencing metadataId
  const period = await prismaClient.period.create({
    data: {
      name,
      startDate,
      endDate,
      active,
      metadataId: metadata.id,
    },
  });

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:periods:create",
    level: "important",
    message: "Period created successfully",
    traceId: options.traceId,
    duration,
    details: {
      periodId: period.id,
      name,
    },
    _references: {
      periodId: "Period",
    },
  });

  return period;
}

export async function createPeriodWithRetry(
  params: CreatePeriodParameters,
  options: CreatePeriodOptions = {},
): Promise<Period> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await createPeriod(params, options);
      } catch (error: any) {
        // non-retryable
        if (error instanceof PeriodInvalidDateRangeError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:periods:create:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during period creation (attempt ${attempt})`,
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