import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Course, Prisma } from "@prisma/client";

import LoggingService from "../../services/logging.js";

type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

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

  if (!existingCourse || !existingCourse.metadata) {
    throw new CourseNotFoundError("Course not found or already restored");
  }

  const now = new Date();

  const historyEntry: MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes: {
      "metadata.deleted": false,
      "metadata.deletedAt": null,
      "metadata.deletedById": null,
    },
  };

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: false,
    deletedAt: null,
    deletedBy: { disconnect: true },
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  const restored = await prismaClient.course.update({
    where: { id: courseId },
    data: { metadata: { update: metadataUpdatePayload } },
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:course:restore",
    level: "important",
    message: "Course restored",
    traceId: options.traceId,
    details: {
      courseId: String(restored.id),
      code: restored.code,
      ...(userAccountId ? { restoredBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      courseId: "Course",
      ...(userAccountId ? { restoredBy: "Account" } : {}),
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
          return undefined as never;
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
