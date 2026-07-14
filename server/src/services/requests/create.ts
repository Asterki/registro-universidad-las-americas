import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  MetadataSource,
  MetadataStatus,
  Prisma,
  Request,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type CreateRequestParameters = {
  accountId: string;
  facultyId: string;
  type: string;
  description?: string;
  date?: Date;
};

type CreateRequestOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class RequestAccountNotFoundError extends Error {
  retryable = false;
  constructor(message = "request-account-not-found") {
    super(message);
    this.name = "RequestAccountNotFoundError";
  }
}

export class RequestFacultyNotFoundError extends Error {
  retryable = false;
  constructor(message = "request-faculty-not-found") {
    super(message);
    this.name = "RequestFacultyNotFoundError";
  }
}

export async function createRequest(
  params: CreateRequestParameters,
  options: CreateRequestOptions = {},
): Promise<Request> {
  const startTime = performance.now();

  const { accountId, facultyId, type, description = "", date } = params;

  const now = new Date();
  const userAccount = options.userAccount;

  try {
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

    // create request referencing metadataId
    const request = await prismaClient.request.create({
      data: {
        accountId,
        facultyId,
        type,
        description,
        date: date ?? now,
        status: "pending",
        metadataId: metadata.id,
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:requests:create",
      level: "important",
      message: "Request created successfully",
      traceId: options.traceId,
      duration,
      details: {
        requestId: request.id,
        accountId,
        facultyId,
        type,
      },
      _references: {
        requestId: "Request",
        accountId: "Account",
        facultyId: "Faculty",
      },
    });

    return request;
  } catch (err: any) {
    // handle foreign key constraint violations (P2003)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      const target = (err.meta as any)?.field_name as string | undefined;
      if (target?.includes("accountId")) {
        throw new RequestAccountNotFoundError();
      }
      if (target?.includes("facultyId")) {
        throw new RequestFacultyNotFoundError();
      }
    }
    throw err;
  }
}

export async function createRequestWithRetry(
  params: CreateRequestParameters,
  options: CreateRequestOptions = {},
): Promise<Request> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await createRequest(params, options);
      } catch (error: any) {
        // non-retryable
        if (
          error instanceof RequestAccountNotFoundError ||
          error instanceof RequestFacultyNotFoundError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:requests:create:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during request creation (attempt ${attempt})`,
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
