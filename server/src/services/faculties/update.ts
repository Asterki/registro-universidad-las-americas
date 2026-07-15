import { performance } from "perf_hooks";
import retry from "async-retry";

import {
  Account,
  Faculty,
  MetadataSource,
  MetadataStatus,
  MetadataUpdateHistory,
  Prisma,
} from "@prisma/client";
import prismaClient from "../../config/prisma.js";

import LoggingService from "../../services/logging.js";

type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;
type MetadataUpdateInput = Prisma.MetadataUpdateInput;

type UpdateFacultyParameters = {
  facultyId: string;
  name?: string;
  code?: string;
  dean?: string | null;
};

type UpdateFacultyOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class FacultyNotFoundError extends Error {
  retryable = false;
  /** @param message Error message */
  constructor(message: string) {
    super(message);
    this.name = "FacultyNotFoundError";
  }
}

export class FacultyExistsError extends Error {
  retryable = false;
  /** @param message Error message */
  constructor(message: string) {
    super(message);
    this.name = "FacultyExistsError";
  }
}

export class FacultyCodeExistsError extends Error {
  retryable = false;
  /** @param message Error message */
  constructor(message: string) {
    super(message);
    this.name = "FacultyCodeExistsError";
  }
}

export async function updateFaculty(
  params: UpdateFacultyParameters,
  options: UpdateFacultyOptions,
): Promise<Faculty> {
  const startTime = performance.now();
  const now = new Date();

  const { facultyId, name, code, dean } = params;
  const userAccountId = options.userAccount?.id;

  // Fetch existing faculty ensuring it's not deleted (metadata.deleted !== true)
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
      metadata: { include: { updateHistory: true } },
    },
  });

  if (!existingFaculty) {
    throw new FacultyNotFoundError("Faculty not found or deleted");
  }

  // Collect changes using external-facing keys
  const changes: MetadataUpdateHistory["changes"] = {};
  const updatePayload: Prisma.FacultyUpdateInput = {};

  // Doing it like this because otherwise we lose type safety
  if (name !== undefined) {
    changes.name = name;
    updatePayload.name = name;
  }
  if (code !== undefined) {
    changes.code = code;
    updatePayload.code = code;
  }
  if (dean !== undefined) {
    changes.dean = dean;
    updatePayload.dean = dean;
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

  if (existingFaculty.metadata) {
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

  try {
    const updated = await prismaClient.faculty.update({
      where: { id: params.facultyId },
      data: updatePayload,
      include: { metadata: { include: { updateHistory: true } } },
    });

    LoggingService.log({
      source: "services:faculty:update",
      level: "important",
      message: "Admin updated faculty",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        facultyId: updated.id,
        updatedBy: userAccountId != null ? userAccountId : undefined,
      },
      _references: {
        facultyId: "Faculty",
        updatedBy: "Account",
      },
    });

    return updated;
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      if ((err.meta as any)?.target?.includes?.("name")) {
        throw new FacultyExistsError(
          "A faculty with this name already exists",
        );
      }
      if ((err.meta as any)?.target?.includes?.("code")) {
        throw new FacultyCodeExistsError(
          "A faculty with this code already exists",
        );
      }
    }
    throw err;
  }
}

export async function updateFacultyWithRetry(
  params: UpdateFacultyParameters,
  options: UpdateFacultyOptions,
): Promise<Faculty> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await updateFaculty(params, options);
      } catch (error: any) {
        if (
          error instanceof FacultyNotFoundError ||
          error instanceof FacultyExistsError ||
          error instanceof FacultyCodeExistsError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:faculty:update:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during faculty update (attempt ${attempt})`,
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
