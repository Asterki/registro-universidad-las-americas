import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Request,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";
type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

import LoggingService from "../../services/logging.js";

type RestoreRequestOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class RequestNotFoundError extends Error {
  retryable = false;
  constructor(message: string) {
    super(message);
    this.name = "RequestNotFoundError";
  }
}

export async function restoreRequest(
  requestId: string,
  options: RestoreRequestOptions = {},
): Promise<Request> {
  const startTime = performance.now();
  const userAccountId = options.userAccount?.id;

  // fetch request with metadata + updateHistory
  const existingRequest = await prismaClient.request.findUnique({
    where: {
      id: requestId,
      metadata: {
        is: {
          deleted: true,
        },
      },
    },
    include: {
      metadata: {
        include: {
          updateHistory: true,
        },
      },
    },
  });

  if (!existingRequest) {
    throw new RequestNotFoundError(
      "Request not found or already restored",
    );
  }

  const now = new Date();

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes: {
      "metadata.deleted": false,
      "metadata.deletedAt": null,
      ...(userAccountId && { "metadata.deletedById": null }),
    },
  };

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: false,
    deletedAt: null,
    deletedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  let updatePayload: Prisma.RequestUpdateInput;

  // Update the metadata
  if (existingRequest.metadata) {
    updatePayload = { metadata: { update: metadataUpdatePayload } };
  } else {
    // In the unlikely case that metadata doesn't exist, create it and mark as deleted
    updatePayload = {
      metadata: {
        create: {
          documentVersion: 1,
          createdAt: now,
          createdById: userAccountId ?? null,
          updatedAt: now,
          updatedById: userAccountId ?? null,
          deleted: false,
          deletedAt: null,
          deletedById: userAccountId ?? null,
          status: MetadataStatus.active,
          source: MetadataSource.manual,
          notes: "",
          tags: "",
          updateHistory: { create: historyEntry },
        },
      },
    };
  }

  // perform update: set metadata.deleted = true and append updateHistory
  const deleted = await prismaClient.request.update({
    where: { id: requestId },
    data: updatePayload,
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:requests:restore",
    level: "important",
    message: "Request restored",
    traceId: options.traceId,
    details: {
      requestId: String(deleted.id),
      type: deleted.type,
      ...(userAccountId !== null ? { restoredBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      requestId: "Request",
      ...(userAccountId !== null ? { restoredBy: "Account" } : {}),
    },
  });

  return deleted;
}

export async function restoreRequestWithRetry(
  requestId: string,
  options: RestoreRequestOptions = {},
): Promise<Request> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await restoreRequest(requestId, options);
      } catch (error: any) {
        if (error instanceof RequestNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:requests:restore:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during request restoration (attempt ${attempt})`,
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