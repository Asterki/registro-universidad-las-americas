import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Period,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type ListPeriodsParameters = {
  active?: boolean;
  name?: string;
};

type ListPeriodsOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listPeriods(
  params: ListPeriodsParameters = {},
  options: ListPeriodsOptions = {},
): Promise<Period[]> {
  const startTime = performance.now();

  const { active, name } = params;

  try {
    const where: Prisma.PeriodWhereInput = {
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    if (active !== undefined) {
      where.active = active;
    }

    if (name !== undefined) {
      where.name = {
        contains: name,
      };
    }

    const periods = await prismaClient.period.findMany({
      where,
      orderBy: {
        startDate: "desc",
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:period:list",
      level: "info",
      message: "Periods listed",
      traceId: options.traceId,
      duration,
      details: {
        count: periods.length,
        ...(active !== undefined ? { active } : {}),
        ...(name ? { name } : {}),
      },
    });

    return periods;
  } catch (err: any) {
    throw err;
  }
}
