import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  CourseInstructor,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type ActivateAssignmentParameters = {
  courseId: string;
  accountId: string;
};

type ActivateAssignmentOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CourseInstructorAssignmentNotFoundError extends Error {
  retryable = false;
  constructor(message = "course-instructor-assignment-not-found") {
    super(message);
    this.name = "CourseInstructorAssignmentNotFoundError";
  }
}

// ---- activateAssignment ----

export async function activateAssignment(
  params: ActivateAssignmentParameters,
  options: ActivateAssignmentOptions = {},
): Promise<CourseInstructor> {
  const startTime = performance.now();

  const { courseId, accountId } = params;
  const userAccountId = options.userAccount?.id;
  const now = new Date();

  const assignment = await prismaClient.courseInstructor.findUnique({
    where: {
      courseId_accountId: {
        courseId,
        accountId,
      },
    },
  });

  if (!assignment) {
    throw new CourseInstructorAssignmentNotFoundError();
  }

  const updated = await prismaClient.courseInstructor.update({
    where: {
      courseId_accountId: {
        courseId,
        accountId,
      },
    },
    data: {
      active: true,
    },
  });

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:course-instructor:status:activate",
    level: "important",
    message: "Course instructor assignment activated",
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

  return updated;
}

// ---- deactivateAssignment ----

export async function deactivateAssignment(
  params: ActivateAssignmentParameters,
  options: ActivateAssignmentOptions = {},
): Promise<CourseInstructor> {
  const startTime = performance.now();

  const { courseId, accountId } = params;
  const userAccountId = options.userAccount?.id;
  const now = new Date();

  const assignment = await prismaClient.courseInstructor.findUnique({
    where: {
      courseId_accountId: {
        courseId,
        accountId,
      },
    },
  });

  if (!assignment) {
    throw new CourseInstructorAssignmentNotFoundError();
  }

  const updated = await prismaClient.courseInstructor.update({
    where: {
      courseId_accountId: {
        courseId,
        accountId,
      },
    },
    data: {
      active: false,
    },
  });

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:course-instructor:status:deactivate",
    level: "important",
    message: "Course instructor assignment deactivated",
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

  return updated;
}

// ---- WithRetry wrappers ----

export async function activateAssignmentWithRetry(
  params: ActivateAssignmentParameters,
  options: ActivateAssignmentOptions = {},
): Promise<CourseInstructor> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await activateAssignment(params, options);
      } catch (error: any) {
        if (error instanceof CourseInstructorAssignmentNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:course-instructor:status:activate:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during assignment activation (attempt ${attempt})`,
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

export async function deactivateAssignmentWithRetry(
  params: ActivateAssignmentParameters,
  options: ActivateAssignmentOptions = {},
): Promise<CourseInstructor> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await deactivateAssignment(params, options);
      } catch (error: any) {
        if (error instanceof CourseInstructorAssignmentNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:course-instructor:status:deactivate:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during assignment deactivation (attempt ${attempt})`,
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
