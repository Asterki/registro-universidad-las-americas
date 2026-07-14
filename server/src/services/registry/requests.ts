import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
  Request,
  RequestStatus,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

// ---- listAllAcademicRequests ----

type ListAllAcademicRequestsParameters = {
  page?: number;
  limit?: number;
  status?: RequestStatus;
  facultyId?: string;
  type?: string;
};

type ListAllAcademicRequestsOptions = {
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

export async function listAllAcademicRequests(
  params: ListAllAcademicRequestsParameters = {},
  options: ListAllAcademicRequestsOptions = {},
): Promise<PaginatedResult<Request>> {
  const startTime = performance.now();

  const { page = 1, limit = 20, status, facultyId, type } = params;
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.RequestWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (facultyId) {
      where.facultyId = facultyId;
    }

    if (type) {
      where.type = {
        contains: type,
      };
    }

    const [requests, total] = await Promise.all([
      prismaClient.request.findMany({
        where,
        skip,
        take: limit,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              email: true,
              accountNumber: true,
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
        orderBy: {
          date: "desc",
        },
      }),
      prismaClient.request.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:registry:requests:list",
      level: "info",
      message: "Academic requests listed",
      traceId: options.traceId,
      duration,
      details: {
        page,
        limit,
        total,
        ...(status ? { status } : {}),
        ...(facultyId ? { facultyId } : {}),
      },
      _references: {
        ...(facultyId ? { facultyId: "Faculty" } : {}),
      },
    });

    return {
      data: requests,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (err: any) {
    throw err;
  }
}

// ---- processAcademicRequest ----

type ProcessAcademicRequestParameters = {
  requestId: string;
  action: "approve" | "reject" | "review" | "resolve";
  response?: string;
};

type ProcessAcademicRequestOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class RequestNotFoundError extends Error {
  retryable = false;
  constructor(message = "request-not-found") {
    super(message);
    this.name = "RequestNotFoundError";
  }
}

export class InvalidRequestActionError extends Error {
  retryable = false;
  constructor(message = "invalid-request-action") {
    super(message);
    this.name = "InvalidRequestActionError";
  }
}

const ACTION_STATUS_MAP: Record<string, RequestStatus> = {
  approve: "approved",
  reject: "rejected",
  review: "in_review",
  resolve: "approved",
};

export async function processAcademicRequest(
  params: ProcessAcademicRequestParameters,
  options: ProcessAcademicRequestOptions = {},
): Promise<Request> {
  const startTime = performance.now();

  const { requestId, action, response } = params;
  const userAccountId = options.userAccount?.id;
  const now = new Date();

  try {
    // fetch the request
    const request = await prismaClient.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new RequestNotFoundError();
    }

    const newStatus = ACTION_STATUS_MAP[action];

    if (!newStatus) {
      throw new InvalidRequestActionError();
    }

    const updateData: Prisma.RequestUpdateInput = {
      status: newStatus,
      processedBy: userAccountId
        ? { connect: { id: userAccountId } }
        : undefined,
      response: response ?? undefined,
    };

    if (action === "approve" || action === "resolve") {
      updateData.resolvedAt = now;
    }

    const updated = await prismaClient.request.update({
      where: { id: requestId },
      data: updateData,
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
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:registry:requests:process",
      level: "important",
      message: `Academic request ${action}d`,
      traceId: options.traceId,
      duration,
      details: {
        requestId,
        action,
        newStatus,
        processedById: userAccountId,
      },
      _references: {
        requestId: "Request",
        ...(userAccountId ? { processedById: "Account" } : {}),
      },
    });

    return updated;
  } catch (err: any) {
    throw err;
  }
}

// ---- WithRetry wrappers ----

export async function processAcademicRequestWithRetry(
  params: ProcessAcademicRequestParameters,
  options: ProcessAcademicRequestOptions = {},
): Promise<Request> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await processAcademicRequest(params, options);
      } catch (error: any) {
        if (
          error instanceof RequestNotFoundError ||
          error instanceof InvalidRequestActionError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:registry:requests:process:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during request processing (attempt ${attempt})`,
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
