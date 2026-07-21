import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as CoordinatorAPITypes from "../../../../shared/api/coordinator.js";

import LoggingService from "../../services/logging.js";
import prismaClient from "../../config/prisma.js";

class CoordinatorNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoordinatorNotFoundError";
  }
}

const handler = async (
  req: Request<{}, {}, CoordinatorAPITypes.GetCoordinatorFacultyScopeRequestBody>,
  res: Response<CoordinatorAPITypes.CoordinatorScopeResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const userAccount = req.user!;

    // Query the account with coordinator role and their faculty scope
    const account = await prismaClient.account.findUnique({
      where: { id: userAccount.id },
      include: {
        facultiesCoordinated: {
          include: {
            campus: true,
          },
        },
        role: true,
      },
    });

    if (!account || account.facultiesCoordinated.length === 0) {
      throw new CoordinatorNotFoundError("Account is not a coordinator");
    }

    const faculty = account.facultiesCoordinated[0];

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:coordinator:scope:get",
      level: "info",
      message: "Coordinator scope retrieved successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountId: userAccount.id,
        facultyId: faculty.id,
      },
    });

    res.status(200).json({
      status: "success",
      faculty,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CoordinatorNotFoundError) {
      res.status(404).json({
        status: "not-coordinator",
      });
      return;
    }

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:coordinator:scope:get",
        level: "error",
        message: "Error getting coordinator scope",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
