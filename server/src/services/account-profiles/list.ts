import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

// ---- listFacultyStudents ----

type ListFacultyStudentsParameters = {
  facultyId: string;
  page?: number;
  limit?: number;
};

type ListFacultyStudentsOptions = {
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

export async function listFacultyStudents(
  params: ListFacultyStudentsParameters,
  options: ListFacultyStudentsOptions = {},
): Promise<PaginatedResult<Account>> {
  const startTime = performance.now();

  const { facultyId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.AccountWhereInput = {
      facultyId,
      role: {
        name: {
          contains: "student",
        },
      },
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
      source: "services:account-profiles:list:facultyStudents",
      level: "info",
      message: "Faculty students listed",
      traceId: options.traceId,
      duration,
      details: {
        facultyId,
        page,
        limit,
        total,
      },
      _references: {
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

// ---- listFacultyInstructors ----

type ListFacultyInstructorsParameters = {
  facultyId: string;
  page?: number;
  limit?: number;
};

type ListFacultyInstructorsOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listFacultyInstructors(
  params: ListFacultyInstructorsParameters,
  options: ListFacultyInstructorsOptions = {},
): Promise<PaginatedResult<Account>> {
  const startTime = performance.now();

  const { facultyId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.AccountWhereInput = {
      facultyId,
      role: {
        name: {
          contains: "instructor",
        },
      },
    };

    const [accounts, total] = await Promise.all([
      prismaClient.account.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          faculty: true,
          campus: true,
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
      source: "services:account-profiles:list:facultyInstructors",
      level: "info",
      message: "Faculty instructors listed",
      traceId: options.traceId,
      duration,
      details: {
        facultyId,
        page,
        limit,
        total,
      },
      _references: {
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
