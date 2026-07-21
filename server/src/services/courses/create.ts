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

import LoggingService from "../../services/logging.js";

type CreateCourseParameters = {
  facultyId: string;
  instructorsIds: string[];
  periodId: string;
  prerequisitesIds: string[];
  code: string;
  name: string;
  credits: number;
  schedule?: string;
  classroom?: string;
  maxCapacity?: number;
};

type CreateCourseOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CourseCodeExistsError extends Error {
  retryable = false;
  constructor(message = "course-code-exists") {
    super(message);
    this.name = "CourseCodeExistsError";
  }
}

export async function createCourse(
  params: CreateCourseParameters,
  options: CreateCourseOptions = {},
): Promise<Course> {
  const startTime = performance.now();

  const {
    facultyId,
    periodId,
    instructorsIds,
    prerequisitesIds: requirementsIds,
    code,
    name,
    credits,
    schedule,
    classroom,
    maxCapacity = 30,
  } = params;

  const now = new Date();
  const userAccount = options.userAccount;

  try {
    const course = await prismaClient.$transaction(async (tx) => {
      const metadata = await tx.metadata.create({
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

      return tx.course.create({
        data: {
          facultyId,
          periodId,
          code,
          name,
          credits,
          ...(schedule !== undefined ? { schedule } : {}),
          ...(classroom !== undefined ? { classroom } : {}),
          maxCapacity,
          metadataId: metadata.id,
          ...(instructorsIds?.length
            ? {
                instructors: {
                  connect: instructorsIds.map((id) => ({ id })),
                },
              }
            : {}),
          ...(requirementsIds?.length
            ? {
                prerequisites: {
                  connect: requirementsIds.map((id) => ({ id })),
                },
              }
            : {}),
        },
      });
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:course:create",
      level: "important",
      message: "Course created successfully",
      traceId: options.traceId,
      duration,
      details: {
        courseId: course.id,
        code,
        name,
        instructorsIds,
        requirementsIds,
      },
      _references: {
        courseId: "Course",
      },
    });

    return course;
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = (err.meta as any)?.target as string[] | undefined;
      if (target?.includes?.("code") && target?.includes?.("periodId")) {
        throw new CourseCodeExistsError();
      }
    }
    throw err;
  }
}

export async function createCourseWithRetry(
  params: CreateCourseParameters,
  options: CreateCourseOptions = {},
): Promise<Course> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await createCourse(params, options);
      } catch (error: any) {
        if (error instanceof CourseCodeExistsError) {
          bail(error);
          return undefined as never;
        }

        LoggingService.log({
          source: "services:course:create:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during course creation (attempt ${attempt})`,
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
