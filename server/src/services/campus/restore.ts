import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Campus,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";
type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

import LoggingService from "../../services/logging.js";

type RestoreCampusOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CampusNotFoundError extends Error {
  retryable = false;
  constructor(message: string) {
    super(message);
    this.name = "CampusNotFoundError";
  }
}

export async function restoreCampus(
  campusId: string,
  options: RestoreCampusOptions = {},
): Promise<Campus> {
  const startTime = performance.now();
  const userAccountId = options.userAccount?.id;

  // fetch campus with metadata + updateHistory
  const existingCampus = await prismaClient.campus.findUnique({
    where: {
      id: campusId,
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

  if (!existingCampus) {
    throw new CampusNotFoundError(
      "Campus not found or already restored",
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

  let updatePayload: Prisma.CampusUpdateInput;

  // Update the metadata
  if (existingCampus.metadata) {
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
  const deleted = await prismaClient.campus.update({
    where: { id: campusId },
    data: updatePayload,
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:campus:restore",
    level: "important",
    message: "Campus restored",
    traceId: options.traceId,
    details: {
      campusId: String(deleted.id),
      name: deleted.name,
      ...(userAccountId !== null ? { restoredBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      campusId: "Campus",
      ...(userAccountId !== null ? { restoredBy: "Account" } : {}),
    },
  });

  return deleted;
}

export async function restoreCampusWithRetry(
  campusId: string,
  options: RestoreCampusOptions = {},
): Promise<Campus> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await restoreCampus(campusId, options);
      } catch (error: any) {
        if (error instanceof CampusNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:campus:restore:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during campus restoration (attempt ${attempt})`,
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
