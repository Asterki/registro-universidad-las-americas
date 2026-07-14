import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type ListCoordinatorStudentsParameters = {
  accountId: string;
  page?: number;
  limit?: number;
};

type ListCoordinatorStudentsOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CoordinatorNotFoundError extends Error {
  retryable = false;
  constructor(message = "coordinator-not-found") {
    super(message);
    this.name = "CoordinatorNotFoundError";
  }
}

type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function listCoordinatorStudents(
  params: ListCoordinatorStudentsParameters,
  options: ListCoordinatorStudentsOptions = {},
): Promise<PaginatedResult<Account>> {
  const startTime = performance.now();

  const { accountId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  try {
    // find the coordinator to get their faculty
    const coordinator = await prismaClient.coordinator.findUnique({
      where: { accountId },
    });

    if (!coordinator) {
      throw new CoordinatorNotFoundError();
    }

    const where: Prisma.AccountWhereInput = {
      facultyId: coordinator.facultyId,
    };

    const [accounts, total] = await Promise.all([
      prismaClient.account.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          faculty: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prismaClient.account.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:coordinator:students",
      level: "info",
      message: "Coordinator students listed",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        facultyId: coordinator.facultyId,
        page,
        limit,
        total,
      },
      _references: {
        accountId: "Account",
        facultyId: "Faculty",
      },
    });

    return {
      data: accounts,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (err: any) {
    throw err;
  }
}
