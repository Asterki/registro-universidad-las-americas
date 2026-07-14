import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Period,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type GetActivePeriodOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class ActivePeriodNotFoundError extends Error {
  retryable = false;
  constructor(message = "no-active-period-found") {
    super(message);
    this.name = "ActivePeriodNotFoundError";
  }
}

export async function getActivePeriod(
  options: GetActivePeriodOptions = {},
): Promise<Period> {
  const startTime = performance.now();

  try {
    const period = await prismaClient.period.findFirst({
      where: {
        active: true,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
    });

    if (!period) {
      throw new ActivePeriodNotFoundError();
    }

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:period:getActive",
      level: "info",
      message: "Active period retrieved",
      traceId: options.traceId,
      duration,
      details: {
        periodId: period.id,
        name: period.name,
      },
      _references: {
        periodId: "Period",
      },
    });

    return period;
  } catch (err: any) {
    throw err;
  }
}
