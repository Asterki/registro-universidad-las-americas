import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Enrollment,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type EnrollSelfParameters = {
  accountId: string;
  courseId: string;
  periodId: string;
};

type EnrollStudentParameters = {
  accountId: string;
  courseId: string;
  periodId: string;
  studentId: string;
};

type EnrollOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class EnrollmentDuplicateError extends Error {
  retryable = false;
  constructor(message = "enrollment-duplicate") {
    super(message);
    this.name = "EnrollmentDuplicateError";
  }
}

export class EnrollmentValidationError extends Error {
  retryable = false;
  constructor(message: string) {
    super(message);
    this.name = "EnrollmentValidationError";
  }
}

async function createEnrollmentRecord(
  accountId: string,
  courseId: string,
  periodId: string,
  options: EnrollOptions,
): Promise<Enrollment> {
  const now = new Date();
  const userAccount = options.userAccount;

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
      registeredAt: now,
      status: "active",
      metadataId: metadata.id,
    },
  });

  return enrollment;
}

export async function enrollSelf(
  params: EnrollSelfParameters,
  options: EnrollOptions = {},
): Promise<Enrollment> {
  const startTime = performance.now();

  const { accountId, courseId, periodId } = params;

  try {
    // check for duplicate enrollment
    const existing = await prismaClient.enrollment.findUnique({
      where: {
        accountId_courseId_periodId: {
          accountId,
          courseId,
          periodId,
        },
      },
    });

    if (existing) {
      throw new EnrollmentDuplicateError();
    }

    const enrollment = await createEnrollmentRecord(
      accountId,
      courseId,
      periodId,
      options,
    );

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:enrollment:enroll-self",
      level: "important",
      message: "Student self-enrolled successfully",
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
      throw new EnrollmentDuplicateError();
    }
    throw err;
  }
}

export async function enrollStudent(
  params: EnrollStudentParameters,
  options: EnrollOptions = {},
): Promise<Enrollment> {
  const startTime = performance.now();

  const { accountId, courseId, periodId, studentId } = params;

  try {
    // check for duplicate enrollment
    const existing = await prismaClient.enrollment.findUnique({
      where: {
        accountId_courseId_periodId: {
          accountId: studentId,
          courseId,
          periodId,
        },
      },
    });

    if (existing) {
      // Delete the existing enrollment if it exists, to allow re-enrollment
      await prismaClient.enrollment.delete({
        where: {
          id: existing.id,
        },
      });
    }

    const enrollment = await createEnrollmentRecord(
      studentId,
      courseId,
      periodId,
      options,
    );

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:enrollment:enroll-student",
      level: "important",
      message: "Student enrolled by admin successfully",
      traceId: options.traceId,
      duration,
      details: {
        enrollmentId: enrollment.id,
        studentId,
        courseId,
        periodId,
        enrolledBy: accountId,
      },
      _references: {
        enrollmentId: "Enrollment",
        studentId: "Account",
        courseId: "Course",
        periodId: "Period",
        enrolledBy: "Account",
      },
    });

    return enrollment;
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new EnrollmentDuplicateError();
    }
    throw err;
  }
}

export async function enrollSelfWithRetry(
  params: EnrollSelfParameters,
  options: EnrollOptions = {},
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await enrollSelf(params, options);
      } catch (error: any) {
        if (
          error instanceof EnrollmentDuplicateError ||
          error instanceof EnrollmentValidationError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollment:enroll-self:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during self-enrollment (attempt ${attempt})`,
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

export async function enrollStudentWithRetry(
  params: EnrollStudentParameters,
  options: EnrollOptions = {},
): Promise<Enrollment> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await enrollStudent(params, options);
      } catch (error: any) {
        if (
          error instanceof EnrollmentDuplicateError ||
          error instanceof EnrollmentValidationError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:enrollment:enroll-student:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during student enrollment (attempt ${attempt})`,
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
