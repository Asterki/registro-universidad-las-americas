import { performance } from "perf_hooks";
import retry from "async-retry";

import {
  Account,
  Request,
  RequestStatus,
  MetadataSource,
  MetadataStatus,
  MetadataUpdateHistory,
  Prisma,
} from "@prisma/client";
import prismaClient from "../../config/prisma.js";

import LoggingService from "../../services/logging.js";

type RequestUpdateInput = Prisma.RequestUpdateInput;
type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;
type MetadataUpdateInput = Prisma.MetadataUpdateInput;

type UpdateRequestParameters = {
  requestId: string;
  type?: string;
  description?: string;
  status?: RequestStatus;
  response?: string;
  resolvedAt?: Date | null;
  processedById?: string;
};

type UpdateRequestOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class RequestNotFoundError extends Error {
  retryable = false;
  /** @param message Error message */
  constructor(message: string) {
    super(message);
    this.name = "RequestNotFoundError";
  }
}

export async function updateRequest(
  params: UpdateRequestParameters,
  options: UpdateRequestOptions,
): Promise<Request> {
  const startTime = performance.now();
  const now = new Date();

  const {
    requestId,
    type,
    description,
    status,
    response,
    resolvedAt,
    processedById,
  } = params;
  const userAccountId = options.userAccount?.id;

  // Fetch existing request ensuring it's not deleted (metadata.deleted !== true)
  const existingRequest = await prismaClient.request.findUnique({
    where: {
      id: requestId,
      metadata: {
        is: {
          deleted: false,
        },
      },
    },
    include: {
      metadata: { include: { updateHistory: true } },
    },
  });

  if (!existingRequest) {
    throw new RequestNotFoundError("Request not found or deleted");
  }

  // Collect changes using external-facing keys
  const changes: MetadataUpdateHistory["changes"] = {};
  const updatePayload: Prisma.RequestUpdateInput = {};

  // Doing it like this because otherwise we lose type safety
  if (type !== undefined) {
    changes.type = type;
    updatePayload.type = type;
  }
  if (description !== undefined) {
    changes.description = description;
    updatePayload.description = description;
  }
  if (status !== undefined) {
    changes.status = status;
    updatePayload.status = status;

    // Auto-set resolvedAt when moving out of pending, unless explicitly provided
    if (resolvedAt === undefined && status !== RequestStatus.pending) {
      changes.resolvedAt = now.toISOString();
      updatePayload.resolvedAt = now;
    }
  }
  if (response !== undefined) {
    changes.response = response;
    updatePayload.response = response;
  }
  if (resolvedAt !== undefined) {
    changes.resolvedAt = resolvedAt ? resolvedAt.toISOString() : null;
    updatePayload.resolvedAt = resolvedAt;
  }
  if (processedById !== undefined) {
    changes.processedById = processedById;
    updatePayload.processedBy = { connect: { id: processedById } };
  }

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes,
  };

  const metadataUpdatePayload: MetadataUpdateInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: {
      create: historyEntry,
    },
  };

  if (existingRequest.metadata) {
    updatePayload.metadata = { update: metadataUpdatePayload };
  } else {
    updatePayload.metadata = {
      create: {
        documentVersion: 1,
        createdAt: now,
        createdById: userAccountId,
        updatedAt: now,
        updatedById: userAccountId,
        deleted: false,
        deletedAt: null,
        deletedById: null,
        status: MetadataStatus.active,
        source: MetadataSource.manual,
        notes: "",
        tags: "",
        updateHistory: { create: historyEntry },
      },
    };
  }

  const updated = await prismaClient.request.update({
    where: { id: params.requestId },
    data: updatePayload,
    include: { metadata: { include: { updateHistory: true } } },
  });

  LoggingService.log({
    source: "services:requests:update",
    level: "important",
    message: "Admin updated request",
    traceId: options.traceId,
    duration: Number((performance.now() - startTime).toFixed(3)),
    details: {
      requestId: updated.id,
      updatedBy: userAccountId != null ? userAccountId : undefined,
    },
    _references: {
      requestId: "Request",
      updatedBy: "Account",
    },
  });

  return updated;
}

export async function updateRequestWithRetry(
  params: UpdateRequestParameters,
  options: UpdateRequestOptions,
): Promise<Request> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await updateRequest(params, options);
      } catch (error: any) {
        if (error instanceof RequestNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:requests:update:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during request update (attempt ${attempt})`,
          details: { error: error?.message, stack: error?.stack },
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