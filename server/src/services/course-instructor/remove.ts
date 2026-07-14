import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  CourseInstructor,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";
import { CourseInstructorExistsError } from "./assign.js";

type RemoveInstructorFromCourseParameters = {
  courseId: string;
  accountId: string;
};

type RemoveInstructorFromCourseOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CourseInstructorNotFoundError extends Error {
  retryable = false;
  constructor(message = "course-instructor-assignment-not-found") {
    super(message);
    this.name = "CourseInstructorNotFoundError";
  }
}

export async function removeInstructorFromCourse(
  params: RemoveInstructorFromCourseParameters,
  options: RemoveInstructorFromCourseOptions = {},
): Promise<CourseInstructor> {
  const startTime = performance.now();

  const { courseId, accountId } = params;
  const userAccountId = options.userAccount?.id;

  // find the assignment
  const assignment = await prismaClient.courseInstructor.findUnique({
    where: {
      courseId_accountId: {
        courseId,
        accountId,
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

  if (!assignment) {
    throw new CourseInstructorNotFoundError();
  }

  const now = new Date();

  const historyEntry: Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes: {
      "metadata.deleted": true,
      "metadata.deletedAt": now.toISOString(),
      ...(userAccountId && { "metadata.deletedById": userAccountId }),
    },
  };

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    deleted: true,
    deletedAt: now,
    deletedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  let updatePayload: Prisma.CourseInstructorUpdateInput;

  if (assignment.metadata) {
    updatePayload = { metadata: { update: metadataUpdatePayload } };
  } else {
    updatePayload = {
      metadata: {
        create: {
          documentVersion: 1,
          createdAt: now,
          createdById: userAccountId ?? null,
          updatedAt: now,
          updatedById: userAccountId ?? null,
          deleted: true,
          deletedAt: now,
          deletedById: userAccountId ?? null,
          status: "active" as any,
          source: "manual" as any,
          notes: "",
          tags: "",
          updateHistory: { create: historyEntry },
        },
      },
    };
  }

  const deleted = await prismaClient.courseInstructor.update({
    where: {
      courseId_accountId: {
        courseId,
        accountId,
      },
    },
    data: updatePayload,
    include: { metadata: { include: { updateHistory: true } } },
  });

  const durationMs = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:course-instructor:remove",
    level: "important",
    message: "Instructor removed from course",
    traceId: options.traceId,
    details: {
      courseInstructorId: String(deleted.id),
      courseId,
      accountId,
      ...(userAccountId ? { deletedBy: String(userAccountId) } : {}),
    },
    duration: durationMs,
    _references: {
      courseInstructorId: "CourseInstructor",
      courseId: "Course",
      accountId: "Account",
      ...(userAccountId ? { deletedBy: "Account" } : {}),
    },
  });

  return deleted;
}

export async function removeInstructorFromCourseWithRetry(
  params: RemoveInstructorFromCourseParameters,
  options: RemoveInstructorFromCourseOptions = {},
): Promise<CourseInstructor> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await removeInstructorFromCourse(params, options);
      } catch (error: any) {
        if (error instanceof CourseInstructorNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:course-instructor:remove:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during instructor removal (attempt ${attempt})`,
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
