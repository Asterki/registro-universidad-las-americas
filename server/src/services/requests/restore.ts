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

import LoggingService from "../../services/logging.js";

type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

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

  if (!existingRequest || !existingRequest.metadata) {
    throw new RequestNotFoundError("Request not found or already restored");
  }

  const now = new Date();

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes: {
      "metadata.deleted": false,
      "metadata.deletedAt": null,
      "metadata.deletedById": null,
    },
  };

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: false,
    deletedAt: null,
    deletedBy: { disconnect: true },
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  const restored = await prismaClient.request.update({
    where: { id: requestId },
    data: { metadata: { update: metadataUpdatePayload } },
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:requests:restore",
    level: "important",
    message: "Request restored",
    traceId: options.traceId,
    details: {
      requestId: String(restored.id),
      type: restored.type,
      ...(userAccountId ? { restoredBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      requestId: "Request",
      ...(userAccountId ? { restoredBy: "Account" } : {}),
    },
  });

  return restored;
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
          return undefined as never;
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
