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

type DeleteFacultyOptions = {
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

export async function deleteFaculty(
  facultyId: string,
  options: DeleteFacultyOptions = {},
): Promise<Faculty> {
  const startTime = performance.now();
  const userAccountId = options.userAccount?.id;

  // fetch faculty with metadata + updateHistory
  const existingFaculty = await prismaClient.faculty.findUnique({
    where: {
      id: facultyId,
      metadata: {
        is: {
          deleted: false,
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
      "Faculty not found or already deleted",
    );
  }

  const now = new Date();

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes: {
      "metadata.deleted": true,
      "metadata.deletedAt": now.toISOString(),
      ...(userAccountId && { "metadata.deletedById": userAccountId }),
    },
  };
  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: true,
    deletedAt: now,
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
    // In the unlikely case that metadata doesn't exist, create it and mark as deleted
    updatePayload = {
      metadata: {
        create: {
          documentVersion: 1,
          createdAt: now,
          createdById: userAccountId ?? null,
          updatedAt: now,
          updatedById: userAccountId ?? null,
          deleted: true,
          deletedAt: now,
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
  const deleted = await prismaClient.faculty.update({
    where: { id: facultyId },
    data: updatePayload,
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:faculties:delete",
    level: "important",
    message: "Faculty deleted",
    traceId: options.traceId,
    details: {
      facultyId: String(deleted.id),
      name: deleted.name,
      ...(userAccountId !== null ? { deletedBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      facultyId: "Faculty",
      ...(userAccountId !== null ? { deletedBy: "Account" } : {}),
    },
  });

  return deleted;
}

export async function deleteFacultyWithRetry(
  facultyId: string,
  options: DeleteFacultyOptions = {},
): Promise<Faculty> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await deleteFaculty(facultyId, options);
      } catch (error: any) {
        if (error instanceof FacultyNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:faculties:delete:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during faculty deletion (attempt ${attempt})`,
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