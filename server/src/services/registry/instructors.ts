import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type ListAllInstructorsParameters = {
  facultyId?: string;
  page?: number;
  limit?: number;
};

type ListAllInstructorsOptions = {
  traceId?: string;
  userAccount?: Account;
};

type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function listAllInstructors(
  params: ListAllInstructorsParameters = {},
  options: ListAllInstructorsOptions = {},
): Promise<PaginatedResult<Account>> {
  const startTime = performance.now();

  const { facultyId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.AccountWhereInput = {
      role: {
        name: {
          contains: "instructor",
        },
      },
    };

    if (facultyId) {
      where.facultyId = facultyId;
    }

    const [accounts, total] = await Promise.all([
      prismaClient.account.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          faculty: true,
          campus: true,
          _count: {
            select: {
              courseInstructorAssignments: true,
            },
          },
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
      source: "services:registry:instructors:list",
      level: "info",
      message: "All instructors listed",
      traceId: options.traceId,
      duration,
      details: {
        page,
        limit,
        total,
        ...(facultyId ? { facultyId } : {}),
      },
      _references: {
        ...(facultyId ? { facultyId: "Faculty" } : {}),
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
