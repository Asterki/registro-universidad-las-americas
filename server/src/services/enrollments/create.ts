import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Enrollment,
  EnrollmentStatus,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type CreateEnrollmentParameters = {
  accountId: string;
  courseId: string;
  periodId: string;
  registeredAt?: Date;
  status?: EnrollmentStatus;
  cancelledAt?: Date | null;
  cancelledById?: string | null;
  finalGrade?: Prisma.Decimal | number | null;
};

type CreateEnrollmentOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class EnrollmentExistsError extends Error {
  retryable = false;

  constructor(message = "enrollment-already-exists") {
    super(message);
    this.name = "EnrollmentExistsError";
  }
}

export async function createEnrollment(
  params: CreateEnrollmentParameters,
  options: CreateEnrollmentOptions = {},
): Promise<Enrollment> {
  const startTime = performance.now();

  const {
    accountId,
    courseId,
    periodId,
    registeredAt = new Date(),
    status = EnrollmentStatus.active,
    cancelledAt = null,
    cancelledById = null,
    finalGrade = null,
  } = params;

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
        // create enrollment referencing metadataId
    const enrollment = await prismaClient.enrollment.create({
      data: {
        accountId,
        courseId,
        periodId,
        registeredAt,
        status,
        cancelledAt,
        cancelledById,
        finalGrade,
        metadataId: metadata.id,
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:enrollments:create",
      level: "important",
      message: "Enrollment created successfully",
      traceId: options.traceId,
      duration,
      details: {
        enrollmentId: enrollment.id,
        accountId,
        courseId,
        periodId,
      },
      _references: {
        enrollmentId: "Enrollment",
        accountId: "Account",
        courseId: "Course",
        periodId: "Period",
      },
    });

    return enrollment;
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new EnrollmentExistsError();
    }

    throw err;
  }
}
export async function createEnrollmentWithRetry(
  params: CreateEnrollmentParameters,
  options: CreateEnrollmentOptions = {},
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();

      try {
        return await createEnrollment(params, options);
      } catch (error: any) {
        // non-retryable
        if (error instanceof EnrollmentExistsError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollments:create:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during enrollment creation (attempt ${attempt})`,
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