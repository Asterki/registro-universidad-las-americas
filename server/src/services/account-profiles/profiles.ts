import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

// ---- getMyProfile ----

type GetMyProfileParameters = {
  accountId: string;
};

type GetMyProfileOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class ProfileNotFoundError extends Error {
  retryable = false;
  constructor(message = "profile-not-found") {
    super(message);
    this.name = "ProfileNotFoundError";
  }
}

export async function getMyProfile(
  params: GetMyProfileParameters,
  options: GetMyProfileOptions = {},
): Promise<Account> {
  const startTime = performance.now();

  const { accountId } = params;

  try {
    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
      include: {
        role: true,
        campus: true,
        faculty: true,
        coordinator: true,
      },
    });

    if (!account) {
      throw new ProfileNotFoundError();
    }

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:account-profiles:getMyProfile",
      level: "info",
      message: "My profile retrieved",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
      },
      _references: {
        accountId: "Account",
      },
    });

    return account;
  } catch (err: any) {
    throw err;
  }
}

// ---- getStudentProfile ----

type GetStudentProfileParameters = {
  accountId: string;
};

type GetStudentProfileOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function getStudentProfile(
  params: GetStudentProfileParameters,
  options: GetStudentProfileOptions = {},
): Promise<Account> {
  const startTime = performance.now();

  const { accountId } = params;

  try {
    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
      include: {
        role: true,
        faculty: true,
        enrollments: {
          include: {
            course: {
              include: {
                period: true,
                faculty: true,
              },
            },
            grades: true,
          },
          orderBy: {
            registeredAt: "desc",
          },
        },
      },
    });

    if (!account) {
      throw new ProfileNotFoundError();
    }

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:account-profiles:getStudentProfile",
      level: "info",
      message: "Student profile retrieved",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
      },
      _references: {
        accountId: "Account",
      },
    });

    return account;
  } catch (err: any) {
    throw err;
  }
}

// ---- getInstructorProfile ----

type GetInstructorProfileParameters = {
  accountId: string;
};

type GetInstructorProfileOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function getInstructorProfile(
  params: GetInstructorProfileParameters,
  options: GetInstructorProfileOptions = {},
): Promise<Account> {
  const startTime = performance.now();

  const { accountId } = params;

  try {
    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
      include: {
        role: true,
        campus: true,
        faculty: true,
        courseInstructorAssignments: {
          where: {
            active: true,
            metadata: {
              is: {
                deleted: false,
              },
            },
          },
          include: {
            course: {
              include: {
                period: true,
                faculty: true,
                _count: {
                  select: {
                    enrollments: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!account) {
      throw new ProfileNotFoundError();
    }

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:account-profiles:getInstructorProfile",
      level: "info",
      message: "Instructor profile retrieved",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        courseCount: account.courseInstructorAssignments.length,
      },
      _references: {
        accountId: "Account",
      },
    });

    return account;
  } catch (err: any) {
    throw err;
  }
}
