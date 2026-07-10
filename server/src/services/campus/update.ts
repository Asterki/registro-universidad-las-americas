import { performance } from "perf_hooks";
import retry from "async-retry";

import {
  Account,
  Campus,
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

type UpdateCampusParameters = {
  campusId: string;
  name?: string;
  city?: string;
  address?: string;
  phone?: string;
  createdAt?: Date;
};

type UpdateCampusOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CampusNotFoundError extends Error {
  retryable = false;
  /** @param message Error message */
  constructor(message: string) {
    super(message);
    this.name = "CampusNotFoundError";
  }
}

export class CampusExistsError extends Error {
  retryable = false;
  /** @param message Error message */
  constructor(message: string) {
    super(message);
    this.name = "CampusExistsError";
  }
}

export async function updateCampus(
  params: UpdateCampusParameters,
  options: UpdateCampusOptions,
): Promise<Campus> {
  const startTime = performance.now();
  const now = new Date();

  const { campusId, name, address, city, createdAt, phone } =
    params;
  const userAccountId = options.userAccount?.id;

  // Fetch existing campus ensuring it's not deleted (metadata.deleted !== true)
  const existingCampus = await prismaClient.campus.findUnique({
    where: {
      id: campusId,
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

  if (!existingCampus) {
    throw new CampusNotFoundError("Campus not found or deleted");
  }

  // Collect changes using external-facing keys
  const changes: MetadataUpdateHistory["changes"] = {};
  const updatePayload: Prisma.CampusUpdateInput = {};

  // Doing it like this because otherwise we lose type safety
  if (name !== undefined) {
    changes.name = name;
    updatePayload.name = name;
  }
  if (address !== undefined) {
    changes.address = address;
    updatePayload.address = address;
  }
  if (city !== undefined) {
    changes.city = city;
    updatePayload.city = city;
  }
  if (phone !== undefined) {
    changes.phone = phone;
    updatePayload.phone = phone;
  }
  if (createdAt !== undefined) {
    changes.createdAt = createdAt.toISOString();
    updatePayload.createdAt = createdAt;
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

  if (existingCampus.metadata) {
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
    const updated = await prismaClient.campus.update({
      where: { id: params.campusId },
      data: updatePayload,
      include: { metadata: { include: { updateHistory: true } } },
    });

    LoggingService.log({
      source: "services:campus:update",
      level: "important",
      message: "Admin updated campus",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        campusId: updated.id,
        updatedBy: userAccountId != null ? userAccountId : undefined,
      },
      _references: {
        campusId: "Campus",
        updatedBy: "Account",
      },
    });

    return updated;
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002" &&
      (err.meta as any)?.target?.includes?.("name")
    ) {
      throw new CampusExistsError(
        "A campus with this name already exists",
      );
    }
    throw err;
  }
}

export async function updateCampusWithRetry(
  params: UpdateCampusParameters,
  options: UpdateCampusOptions,
): Promise<Campus> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await updateCampus(params, options);
      } catch (error: any) {
        if (error instanceof CampusNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:campus:update:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during campus update (attempt ${attempt})`,
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
