import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
  Request,
  RequestStatus,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type ListRequestsParameters = {
  page?: number;
  limit?: number;
  status?: RequestStatus;
  facultyId?: string;
  type?: string;
  accountId?: string;
};

type ListRequestsOptions = {
  traceId?: string;
  userAccount?: Account;
};

type ListRequestsResult = {
  requests: Request[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function listRequests(
  params: ListRequestsParameters = {},
  options: ListRequestsOptions = {},
): Promise<ListRequestsResult> {
  const startTime = performance.now();

  const {
    page = 1,
    limit = 20,
    status,
    facultyId,
    type,
    accountId,
  } = params;

  const skip = (page - 1) * limit;

  try {
    // build where clause
    const where: Prisma.RequestWhereInput = {
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    if (status) {
      where.status = status;
    }
    if (facultyId) {
      where.facultyId = facultyId;
    }
    if (type) {
      where.type = type;
    }
    if (accountId) {
      where.accountId = accountId;
    }

    const [requests, total] = await Promise.all([
      prismaClient.request.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          faculty: true,
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          date: "desc",
        },
      }),
      prismaClient.request.count({ where }),
    ]);

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:requests:list",
      level: "info",
      message: "Requests listed",
      traceId: options.traceId,
      duration,
      details: {
        page,
        limit,
        total,
        filters: {
          ...(status ? { status } : {}),
          ...(facultyId ? { facultyId } : {}),
          ...(type ? { type } : {}),
          ...(accountId ? { accountId } : {}),
        },
      },
    });

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err: any) {
    throw err;
  }
}
