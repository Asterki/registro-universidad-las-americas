import { performance } from "perf_hooks";
import retry from "async-retry";

import {
  Account,
  Course,
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

type UpdateCourseParameters = {
  courseId: string;
  code?: string;
  name?: string;
  credits?: number;
  schedule?: string;
  classroom?: string;
  maxCapacity?: number;
  facultyId?: string;
  periodId?: string;
};

type UpdateCourseOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CourseNotFoundError extends Error {
  retryable = false;
  /** @param message Error message */
  constructor(message: string) {
    super(message);
    this.name = "CourseNotFoundError";
  }
}

export class CourseCodeExistsError extends Error {
  retryable = false;
  /** @param message Error message */
  constructor(message: string) {
    super(message);
    this.name = "CourseCodeExistsError";
  }
}

export async function updateCourse(
  params: UpdateCourseParameters,
  options: UpdateCourseOptions,
): Promise<Course> {
  const startTime = performance.now();
  const now = new Date();

  const { courseId, code, name, credits, schedule, classroom, maxCapacity, facultyId, periodId } =
    params;
  const userAccountId = options.userAccount?.id;

  // Fetch existing course ensuring it's not deleted (metadata.deleted !== true)
  const existingCourse = await prismaClient.course.findUnique({
    where: {
      id: courseId,
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

  if (!existingCourse) {
    throw new CourseNotFoundError("Course not found or deleted");
  }

  // Collect changes using external-facing keys
  const changes: MetadataUpdateHistory["changes"] = {};
  const updatePayload: Prisma.CourseUpdateInput = {};

  // Doing it like this because otherwise we lose type safety
  if (code !== undefined) {
    changes.code = code;
    updatePayload.code = code;
  }
  if (name !== undefined) {
    changes.name = name;
    updatePayload.name = name;
  }
  if (credits !== undefined) {
    changes.credits = credits;
    updatePayload.credits = credits;
  }
  if (schedule !== undefined) {
    changes.schedule = schedule;
    updatePayload.schedule = schedule;
  }
  if (classroom !== undefined) {
    changes.classroom = classroom;
    updatePayload.classroom = classroom;
  }
  if (maxCapacity !== undefined) {
    changes.maxCapacity = maxCapacity;
    updatePayload.maxCapacity = maxCapacity;
  }
  if (facultyId !== undefined) {
    changes.facultyId = facultyId;
    updatePayload.faculty = { connect: { id: facultyId } };
  }
  if (periodId !== undefined) {
    changes.periodId = periodId;
    updatePayload.period = { connect: { id: periodId } };
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

  if (existingCourse.metadata) {
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
    const updated = await prismaClient.course.update({
      where: { id: params.courseId },
      data: updatePayload,
      include: { metadata: { include: { updateHistory: true } } },
    });

    LoggingService.log({
      source: "services:course:update",
      level: "important",
      message: "Admin updated course",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        courseId: updated.id,
        updatedBy: userAccountId != null ? userAccountId : undefined,
      },
      _references: {
        courseId: "Course",
        updatedBy: "Account",
      },
    });

    return updated;
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = (err.meta as any)?.target as string[] | undefined;
      if (target?.includes?.("code") && target?.includes?.("periodId")) {
        throw new CourseCodeExistsError(
          "A course with this code already exists in the selected period",
        );
      }
    }
    throw err;
  }
}

export async function updateCourseWithRetry(
  params: UpdateCourseParameters,
  options: UpdateCourseOptions,
): Promise<Course> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await updateCourse(params, options);
      } catch (error: any) {
        if (error instanceof CourseNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:course:update:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during course update (attempt ${attempt})`,
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
