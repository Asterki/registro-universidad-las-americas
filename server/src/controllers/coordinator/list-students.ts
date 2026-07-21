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
  req: Request<{}, {}, CoordinatorAPITypes.ListCoordinatorStudentsRequestBody>,
  res: Response<CoordinatorAPITypes.CoordinatorStudentsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const userAccount = req.user!;
    const { page = 0, count = 20 } = req.body;

    // Get the coordinator's faculty
    const account = await prismaClient.account.findUnique({
      where: { id: userAccount.id },
      include: {
        facultiesCoordinated: {
          select: { id: true },
        },
      },
    });

    if (!account || account.facultiesCoordinated.length === 0) {
      throw new CoordinatorNotFoundError("Account is not a coordinator");
    }

    const facultyId = account.facultiesCoordinated[0].id;

    // Query accounts where faculty matches coordinator's faculty and role is student
    const where: Prisma.AccountWhereInput = {
      facultyId,
      role: {
        name: "student",
      },
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    const [data, total] = await Promise.all([
      prismaClient.account.findMany({
        where,
        skip: page * count,
        take: count,
        orderBy: {
          name: "asc",
        },
      }),
      prismaClient.account.count({ where }),
    ]);

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:coordinator:students:list",
      level: "info",
      message: "Coordinator students listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountId: userAccount.id,
        page,
        limit: count,
        total,
      },
    });

    res.status(200).json({
      status: "success",
      students: data,
      total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CoordinatorNotFoundError) {
      res.status(404).json({
        status: "internal-error",
      });
      return;
    }

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:coordinator:students:list",
        level: "error",
        message: "Error listing coordinator students",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
