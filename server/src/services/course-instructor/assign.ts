import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  CourseInstructor,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type AssignInstructorToCourseParameters = {
  courseId: string;
  accountId: string;
};

type AssignInstructorToCourseOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CourseInstructorExistsError extends Error {
  retryable = false;
  constructor(message = "instructor-already-assigned-to-course") {
    super(message);
    this.name = "CourseInstructorExistsError";
  }
}

export class CourseNotFoundError extends Error {
  retryable = false;
  constructor(message = "course-not-found") {
    super(message);
    this.name = "CourseNotFoundError";
  }
}

export class InstructorNotFoundError extends Error {
  retryable = false;
  constructor(message = "instructor-not-found") {
    super(message);
    this.name = "InstructorNotFoundError";
  }
}

export async function assignInstructorToCourse(
  params: AssignInstructorToCourseParameters,
  options: AssignInstructorToCourseOptions = {},
): Promise<CourseInstructor> {
  const startTime = performance.now();

  const { courseId, accountId } = params;
  const now = new Date();
  const userAccount = options.userAccount;

  try {
    // verify course exists and is not deleted
    const course = await prismaClient.course.findUnique({
      where: {
        id: courseId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
    });

    if (!course) {
      throw new CourseNotFoundError();
    }

    // verify account exists
    const instructor = await prismaClient.account.findUnique({
      where: { id: accountId },
    });

    if (!instructor) {
      throw new InstructorNotFoundError();
    }

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

    // create course-instructor assignment referencing metadataId
    const assignment = await prismaClient.courseInstructor.create({
      data: {
        courseId,
        accountId,
        active: true,
        metadataId: metadata.id,
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:course-instructor:assign",
      level: "important",
      message: "Instructor assigned to course",
      traceId: options.traceId,
      duration,
      details: {
        courseInstructorId: assignment.id,
        courseId,
        accountId,
      },
      _references: {
        courseInstructorId: "CourseInstructor",
        courseId: "Course",
        accountId: "Account",
      },
    });

    return assignment;
  } catch (err: any) {
    // handle unique constraint on [courseId, accountId] (P2002)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      if (
        (err.meta as any)?.target?.includes?.("courseId") &&
        (err.meta as any)?.target?.includes?.("accountId")
      ) {
        throw new CourseInstructorExistsError();
      }
    }
    throw err;
  }
}

export async function assignInstructorToCourseWithRetry(
  params: AssignInstructorToCourseParameters,
  options: AssignInstructorToCourseOptions = {},
): Promise<CourseInstructor> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await assignInstructorToCourse(params, options);
      } catch (error: any) {
        if (
          error instanceof CourseInstructorExistsError ||
          error instanceof CourseNotFoundError ||
          error instanceof InstructorNotFoundError
        ) {
          bail(error);
        }

        LoggingService.log({
          source: "services:course-instructor:assign:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during instructor assignment (attempt ${attempt})`,
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
