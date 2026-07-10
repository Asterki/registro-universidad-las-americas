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

import LoggingService from "../../services/logging.js";

type CreateCampusParameters = {
  name: string;
  city: string;
  address: string;
  phone: string;
  createdAt: Date;
};

type CreateCampusOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CampusExistsError extends Error {
  retryable = false;
  constructor(message = "campus-name-in-use") {
    super(message);
    this.name = "CampusExistsError";
  }
}

export async function createCampus(
  params: CreateCampusParameters,
  options: CreateCampusOptions = {},
): Promise<Campus> {
  const startTime = performance.now();

  const { name, address, city, createdAt, phone } = params;

  const now = new Date();
  const userAccount = options.userAccount;

  try {
    // create metadata first
    const metadata = await prismaClient.metadata.create({
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

    // create campus referencing metadataId
    const campus = await prismaClient.campus.create({
      data: {
        name,
        address,
        city,
        createdAt,
        phone,
        metadataId: metadata.id,
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:campus:create",
      level: "important",
      message: "Campus created successfully",
      traceId: options.traceId,
      duration,
      details: {
        campusId: campus.id,
        name,
      },
      _references: {
        campusId: "Campus",
      },
    });

    return campus;
  } catch (err: any) {
    // handle unique constraint on name (P2002)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      if ((err.meta as any)?.target?.includes?.("name")) {
        throw new CampusExistsError();
      }
    }
    throw err;
  }
}

export async function createCampusWithRetry(
  params: CreateCampusParameters,
  options: CreateCampusOptions = {},
): Promise<Campus> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await createCampus(params, options);
      } catch (error: any) {
        // non-retryable
        if (error instanceof CampusExistsError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:campus:create:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during campus creation (attempt ${attempt})`,
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
