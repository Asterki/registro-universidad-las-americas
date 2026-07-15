import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Faculty,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";
type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

import LoggingService from "../../services/logging.js";

type RestoreFacultyOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class FacultyNotFoundError extends Error {
  retryable = false;
  constructor(message: string) {
    super(message);
    this.name = "FacultyNotFoundError";
  }
}

export async function restoreFaculty(
  facultyId: string,
  options: RestoreFacultyOptions = {},
): Promise<Faculty> {
  const startTime = performance.now();
  const userAccountId = options.userAccount?.id;

  // fetch faculty with metadata + updateHistory
  const existingFaculty = await prismaClient.faculty.findUnique({
    where: {
      id: facultyId,
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

  if (!existingFaculty) {
    throw new FacultyNotFoundError(
      "Faculty not found or already restored",
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

  let updatePayload: Prisma.FacultyUpdateInput;

  // Update the metadata
  if (existingFaculty.metadata) {
    updatePayload = { metadata: { update: metadataUpdatePayload } };
  } else {
    // In the unlikely case that metadata doesn't exist, create it and mark as restored
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

  // perform update: set metadata.deleted = false and append updateHistory
  const restored = await prismaClient.faculty.update({
    where: { id: facultyId },
    data: updatePayload,
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:faculty:restore",
    level: "important",
    message: "Faculty restored",
    traceId: options.traceId,
    details: {
      facultyId: String(restored.id),
      name: restored.name,
      ...(userAccountId !== null ? { restoredBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      facultyId: "Faculty",
      ...(userAccountId !== null ? { restoredBy: "Account" } : {}),
    },
  });

  return restored;
}

export async function restoreFacultyWithRetry(
  facultyId: string,
  options: RestoreFacultyOptions = {},
): Promise<Faculty> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await restoreFaculty(facultyId, options);
      } catch (error: any) {
        if (error instanceof FacultyNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:faculty:restore:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during faculty restoration (attempt ${attempt})`,
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
