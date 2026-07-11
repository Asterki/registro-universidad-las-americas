import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Course,
  MetadataSource,
  MetadataStatus,
  Prisma,
} from "@prisma/client";

type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

import LoggingService from "../../services/logging.js";

type RestoreCourseOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CourseNotFoundError extends Error {
  retryable = false;

  constructor(message: string) {
    super(message);
    this.name = "CourseNotFoundError";
  }
}

export async function restoreCourse(
  courseId: string,
  options: RestoreCourseOptions = {},
): Promise<Course> {
  const startTime = performance.now();
  const userAccountId = options.userAccount?.id;

  const existingCourse = await prismaClient.course.findUnique({
    where: {
      id: courseId,
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

  if (!existingCourse) {
    throw new CourseNotFoundError(
      "Course not found or already restored",
    );
  }

  const now = new Date();

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId
      ? {
          connect: {
            id: userAccountId,
          },
        }
      : undefined,
    changes: {
      "metadata.deleted": false,
      "metadata.deletedAt": null,
      ...(userAccountId && {
        "metadata.deletedById": null,
      }),
    },
  };

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: false,
    deletedAt: null,
    deletedBy: userAccountId
      ? {
          connect: {
            id: userAccountId,
          },
        }
      : undefined,
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

  let updatePayload: Prisma.CourseUpdateInput;

  if (existingCourse.metadata) {
    updatePayload = {
      metadata: {
        update: metadataUpdatePayload,
      },
    };
  } else {
    updatePayload = {
      metadata: {
        create: {
          documentVersion: 1,
          createdAt: now,
          createdById: userAccountId ?? null,
          updatedAt: now,
          updatedById: userAccountId ?? null,
          deleted: false,
          deletedAt: null,
          deletedById: userAccountId ?? null,
          status: MetadataStatus.active,
          source: MetadataSource.manual,
          notes: "",
          tags: "",
          updateHistory: {
            create: historyEntry,
          },
        },
      },
    };
  }
    const restored = await prismaClient.course.update({
    where: {
      id: courseId,
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

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:course:restore",
    level: "important",
    message: "Course restored",
    traceId: options.traceId,
    details: {
      courseId: String(restored.id),
      name: restored.name,
      ...(userAccountId != null
        ? {
            restoredBy: String(userAccountId),
          }
        : {}),
    },
    duration: durationMs,
    _references: {
      courseId: "Course",
      ...(userAccountId != null
        ? {
            restoredBy: "Account",
          }
        : {}),
    },
  });

  return restored;
}

export async function restoreCourseWithRetry(
  courseId: string,
  options: RestoreCourseOptions = {},
): Promise<Course> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();

      try {
        return await restoreCourse(courseId, options);
      } catch (error: any) {
        if (error instanceof CourseNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:course:restore:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during course restoration (attempt ${attempt})`,
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