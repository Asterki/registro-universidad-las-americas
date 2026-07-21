import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Faculty, Prisma } from "@prisma/client";

import LoggingService from "../../services/logging.js";

type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

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

  if (!existingFaculty || !existingFaculty.metadata) {
    throw new FacultyNotFoundError("Faculty not found or already restored");
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

  const restored = await prismaClient.faculty.update({
    where: { id: facultyId },
    data: { metadata: { update: metadataUpdatePayload } },
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
      ...(userAccountId ? { restoredBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      facultyId: "Faculty",
      ...(userAccountId ? { restoredBy: "Account" } : {}),
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
          return undefined as never;
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
