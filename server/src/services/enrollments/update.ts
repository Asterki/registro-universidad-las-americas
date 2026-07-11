import { performance } from "perf_hooks";
import retry from "async-retry";

import {
  Account,
  Enrollment,
  EnrollmentStatus,
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

type UpdateEnrollmentParameters = {
  enrollmentId: string;

  accountId?: string;
  courseId?: string;
  periodId?: string;

  registeredAt?: Date;
  status?: EnrollmentStatus;

  cancelledAt?: Date | null;
  cancelledById?: string | null;

  finalGrade?: Prisma.Decimal | number | null;
};

type UpdateEnrollmentOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class EnrollmentNotFoundError extends Error {
  retryable = false;

  constructor(message = "enrollment-not-found") {
    super(message);
    this.name = "EnrollmentNotFoundError";
  }
}

export class EnrollmentExistsError extends Error {
  retryable = false;

  constructor(message = "enrollment-already-exists") {
    super(message);
    this.name = "EnrollmentExistsError";
  }
}

export async function updateEnrollment(
  params: UpdateEnrollmentParameters,
  options: UpdateEnrollmentOptions = {},
): Promise<Enrollment> {
  const startTime = performance.now();
  const now = new Date();

  const {
    enrollmentId,
    accountId,
    courseId,
    periodId,
    registeredAt,
    status,
    cancelledAt,
    cancelledById,
    finalGrade,
  } = params;

  const userAccountId = options.userAccount?.id;

  const existingEnrollment = await prismaClient.enrollment.findUnique({
    where: {
      id: enrollmentId,
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

  if (!existingEnrollment) {
    throw new EnrollmentNotFoundError();
  }

  const changes: MetadataUpdateHistory["changes"] = {};

  const updatePayload: Prisma.EnrollmentUpdateInput = {};
    if (accountId !== undefined) {
    changes.accountId = accountId;
    updatePayload.account = {
      connect: {
        id: accountId,
      },
    };
  }

  if (courseId !== undefined) {
    changes.courseId = courseId;
    updatePayload.course = {
      connect: {
        id: courseId,
      },
    };
  }

  if (periodId !== undefined) {
    changes.periodId = periodId;
    updatePayload.period = {
      connect: {
        id: periodId,
      },
    };
  }

  if (registeredAt !== undefined) {
   changes.registeredAt = registeredAt.toISOString();
    updatePayload.registeredAt = registeredAt;
  }

  if (status !== undefined) {
    changes.status = status;
    updatePayload.status = status;
  }

  if (cancelledAt !== undefined) {
   changes.cancelledAt =
  cancelledAt === null ? null : cancelledAt.toISOString();
    updatePayload.cancelledAt = cancelledAt;
  }

  if (cancelledById !== undefined) {
    changes.cancelledById = cancelledById;

    updatePayload.cancelledBy = cancelledById
      ? {
          connect: {
            id: cancelledById,
          },
        }
      : {
          disconnect: true,
        };
  }

  if (finalGrade !== undefined) {
    changes.finalGrade =
  finalGrade == null ? null : finalGrade.toString();
    updatePayload.finalGrade = finalGrade;
  }

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId
      ? {
          connect: {
            id: userAccountId,
          },
        }
      : undefined,
    changes,
  };

  const metadataUpdatePayload: MetadataUpdateInput = {
    updatedAt: now,
    updatedBy: userAccountId
      ? {
          connect: {
            id: userAccountId,
          },
        }
      : undefined,
    updateHistory: {
      create: historyEntry,
    },
  };

  if (existingEnrollment.metadata) {
    updatePayload.metadata = {
      update: metadataUpdatePayload,
    };
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
        updateHistory: {
          create: historyEntry,
        },
      },
    };
  }

  try {
    const updated = await prismaClient.enrollment.update({
      where: {
        id: enrollmentId,
      },
      data: updatePayload,
      include: {
        metadata: {
          include: {
            updateHistory: true,
          },
        },
      },
    });

    LoggingService.log({
      source: "services:enrollments:update",
      level: "important",
      message: "Enrollment updated successfully",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        enrollmentId: updated.id,
        updatedBy: userAccountId,
      },
      _references: {
        enrollmentId: "Enrollment",
        updatedBy: "Account",
      },
    });

    return updated;
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

export async function updateEnrollmentWithRetry(
  params: UpdateEnrollmentParameters,
  options: UpdateEnrollmentOptions = {},
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();

      try {
        return await updateEnrollment(params, options);
      } catch (error: any) {
        if (
          error instanceof EnrollmentNotFoundError ||
          error instanceof EnrollmentExistsError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollments:update:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during enrollment update (attempt ${attempt})`,
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