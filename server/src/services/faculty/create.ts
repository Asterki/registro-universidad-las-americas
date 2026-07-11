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

import LoggingService from "../../services/logging.js";

type CreateFacultyParameters = {
  campusId: string;
  name: string;
  code: string;
  dean?: string;
};

type CreateFacultyOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class FacultyExistsError extends Error {
  retryable = false;
  constructor(message = "faculty-code-in-use") {
    super(message);
    this.name = "FacultyExistsError";
  }
}

export async function createFaculty(
  params: CreateFacultyParameters,
  options: CreateFacultyOptions = {},
): Promise<Faculty> {
  const startTime = performance.now();

  const { campusId, name, code, dean = "" } = params;

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

    // create faculty referencing metadataId
    const faculty = await prismaClient.faculty.create({
      data: {
        campusId,
        name,
        code,
        dean,
        metadataId: metadata.id,
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:faculties:create",
      level: "important",
      message: "Faculty created successfully",
      traceId: options.traceId,
      duration,
      details: {
        facultyId: faculty.id,
        name,
        code,
      },
      _references: {
        facultyId: "Faculty",
      },
    });

    return faculty;
  } catch (err: any) {
    // handle unique constraint on code (P2002)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      if ((err.meta as any)?.target?.includes?.("code")) {
        throw new FacultyExistsError();
      }
    }
    throw err;
  }
}

export async function createFacultyWithRetry(
  params: CreateFacultyParameters,
  options: CreateFacultyOptions = {},
): Promise<Faculty> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await createFaculty(params, options);
      } catch (error: any) {
        // non-retryable
        if (error instanceof FacultyExistsError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:faculties:create:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during faculty creation (attempt ${attempt})`,
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