import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
  Request,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type GetRequestDetailParameters = {
  requestId: string;
};

type GetRequestDetailOptions = {
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

export async function getRequestDetail(
  params: GetRequestDetailParameters,
  options: GetRequestDetailOptions = {},
): Promise<Request> {
  const startTime = performance.now();

  const { requestId } = params;

  try {
    const request = await prismaClient.request.findUnique({
      where: {
        id: requestId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
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
        metadata: {
          include: {
            updateHistory: {
              orderBy: {
                updatedAt: "desc",
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new RequestNotFoundError();
    }

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:requests:detail",
      level: "info",
      message: "Request detail retrieved",
      traceId: options.traceId,
      duration,
      details: {
        requestId,
        status: request.status,
        type: request.type,
      },
      _references: {
        requestId: "Request",
      },
    });

    return request;
  } catch (err: any) {
    if (err instanceof RequestNotFoundError) {
      throw err;
    }
    throw err;
  }
}
