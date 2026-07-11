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
  periodId: string;
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

export class CourseExistsError extends Error {
  retryable = false;

  constructor(message = "course-already-exists") {
    super(message);
    this.name = "CourseExistsError";
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
        // create course referencing metadataId
    const course = await prismaClient.course.create({
      data: {
        facultyId,
        periodId,
        code,
        name,
        credits,
        schedule,
        classroom,
        maxCapacity,
        metadataId: metadata.id,
      },
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
      },
      _references: {
        courseId: "Course",
      },
    });

    return course;
  } catch (err: any) {
    // Handle duplicate course (code + period)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new CourseExistsError();
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
        // Non-retryable error
        if (error instanceof CourseExistsError) {
          bail(error);
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