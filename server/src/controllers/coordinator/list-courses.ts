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
  req: Request<{}, {}, CoordinatorAPITypes.ListCoordinatorCoursesRequestBody>,
  res: Response<CoordinatorAPITypes.CoordinatorCoursesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const userAccount = req.user!;

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

    // Query courses filtered by the coordinator's faculty
    const courses = await prismaClient.course.findMany({
      where: {
        facultyId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      include: {
        instructors: true,
        period: true,
        faculty: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:coordinator:courses:list",
      level: "info",
      message: "Coordinator courses listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountId: userAccount.id,
        count: courses.length,
      },
    });

    res.status(200).json({
      status: "success",
      courses,
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
        source: "api:coordinator:courses:list",
        level: "error",
        message: "Error listing coordinator courses",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
