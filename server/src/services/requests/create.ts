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
  accountId?: string;
  facultyId: string;
  type: string;
  description?: string;
  date?: Date;
};

type CreateRequestOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class RequestAccountRequiredError extends Error {
  retryable = false;
  constructor(message = "request-account-required") {
    super(message);
    this.name = "RequestAccountRequiredError";
  }
}

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

  const { facultyId, type, description = "", date } = params;
  const now = new Date();
  const userAccount = options.userAccount;

  const accountId = params.accountId ?? userAccount?.id;
  if (!accountId) {
    throw new RequestAccountRequiredError();
  }

  try {
    const request = await prismaClient.$transaction(async (tx) => {
      const metadata = await tx.metadata.create({
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

      return tx.request.create({
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
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      const field = (err.meta as any)?.field_name as string | undefined;
      if (field?.includes("accountId")) {
        throw new RequestAccountNotFoundError();
      }
      if (field?.includes("facultyId")) {
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
        if (
          error instanceof RequestAccountRequiredError ||
          error instanceof RequestAccountNotFoundError ||
          error instanceof RequestFacultyNotFoundError
        ) {
          bail(error);
          return undefined as never;
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
