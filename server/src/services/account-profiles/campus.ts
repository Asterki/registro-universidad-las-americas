import retry from "async-retry";
import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type AssignInstructorCampusParameters = {
  accountId: string;
  campusId: string;
};

type AssignInstructorCampusOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class InstructorCampusNotFoundError extends Error {
  retryable = false;
  constructor(message = "instructor-or-campus-not-found") {
    super(message);
    this.name = "InstructorCampusNotFoundError";
  }
}

// ---- assignInstructorCampus ----

export async function assignInstructorCampus(
  params: AssignInstructorCampusParameters,
  options: AssignInstructorCampusOptions = {},
): Promise<Account> {
  const startTime = performance.now();

  const { accountId, campusId } = params;
  const userAccountId = options.userAccount?.id;

  // verify instructor exists
  const instructor = await prismaClient.account.findUnique({
    where: { id: accountId },
  });

  if (!instructor) {
    throw new InstructorCampusNotFoundError();
  }

  // verify campus exists
  const campus = await prismaClient.campus.findUnique({
    where: { id: campusId },
  });

  if (!campus) {
    throw new InstructorCampusNotFoundError();
  }

  const updated = await prismaClient.account.update({
    where: { id: accountId },
    data: {
      campusId,
    },
  });

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:account-profiles:campus:assign",
    level: "important",
    message: "Instructor campus assigned",
    traceId: options.traceId,
    duration,
    details: {
      accountId,
      campusId,
    },
    _references: {
      accountId: "Account",
      campusId: "Campus",
    },
  });

  return updated;
}

// ---- removeInstructorCampus ----

export async function removeInstructorCampus(
  params: { accountId: string },
  options: AssignInstructorCampusOptions = {},
): Promise<Account> {
  const startTime = performance.now();

  const { accountId } = params;
  const userAccountId = options.userAccount?.id;

  // verify instructor exists
  const instructor = await prismaClient.account.findUnique({
    where: { id: accountId },
  });

  if (!instructor) {
    throw new InstructorCampusNotFoundError();
  }

  const updated = await prismaClient.account.update({
    where: { id: accountId },
    data: {
      campusId: null,
    },
  });

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:account-profiles:campus:remove",
    level: "important",
    message: "Instructor campus removed",
    traceId: options.traceId,
    duration,
    details: {
      accountId,
    },
    _references: {
      accountId: "Account",
    },
  });

  return updated;
}

// ---- WithRetry wrappers ----

export async function assignInstructorCampusWithRetry(
  params: AssignInstructorCampusParameters,
  options: AssignInstructorCampusOptions = {},
): Promise<Account> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await assignInstructorCampus(params, options);
      } catch (error: any) {
        if (error instanceof InstructorCampusNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:account-profiles:campus:assign:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during campus assignment (attempt ${attempt})`,
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

export async function removeInstructorCampusWithRetry(
  params: { accountId: string },
  options: AssignInstructorCampusOptions = {},
): Promise<Account> {
  return retry(
    async (bail, attempt) => {
      const startTime = performance.now();
      try {
        return await removeInstructorCampus(params, options);
      } catch (error: any) {
        if (error instanceof InstructorCampusNotFoundError) {
          bail(error);
        }

        LoggingService.log({
          source: "services:account-profiles:campus:remove:retry",
          level: "warning",
          traceId: options.traceId,
          duration: Number((performance.now() - startTime).toFixed(3)),
          message: `Retryable error during campus removal (attempt ${attempt})`,
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
