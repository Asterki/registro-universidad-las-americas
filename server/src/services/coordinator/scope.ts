import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Coordinator,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type GetCoordinatorFacultyScopeParameters = {
  accountId: string;
};

type GetCoordinatorFacultyScopeOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class CoordinatorNotFoundError extends Error {
  retryable = false;
  constructor(message = "coordinator-not-found") {
    super(message);
    this.name = "CoordinatorNotFoundError";
  }
}

export async function getCoordinatorFacultyScope(
  params: GetCoordinatorFacultyScopeParameters,
  options: GetCoordinatorFacultyScopeOptions = {},
): Promise<Coordinator> {
  const startTime = performance.now();

  const { accountId } = params;

  try {
    const coordinator = await prismaClient.coordinator.findUnique({
      where: { accountId },
      include: {
        faculty: {
          include: {
            campus: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!coordinator) {
      throw new CoordinatorNotFoundError();
    }

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:coordinator:scope",
      level: "info",
      message: "Coordinator faculty scope retrieved",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        coordinatorId: coordinator.id,
        facultyId: coordinator.facultyId,
        facultyName: coordinator.faculty.name,
      },
      _references: {
        accountId: "Account",
        coordinatorId: "Coordinator",
        facultyId: "Faculty",
      },
    });

    return coordinator;
  } catch (err: any) {
    throw err;
  }
}
