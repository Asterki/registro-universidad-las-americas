import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as PeriodAPITypes from "../../../../shared/api/period.js";

import LoggingService from "../../services/logging.js";
import { createPeriodWithRetry } from "../../services/period/create.js";

import prismaClient from "../../config/prisma.js";

class NameInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NameInUseError";
  }
}

const handler = async (
  req: Request<{}, {}, PeriodAPITypes.CreatePeriodRequestBody>,
  res: Response<PeriodAPITypes.CreatePeriodResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { name, startDate, endDate, active } = req.body;

  const userAccount = req.user!;

  try {
    // Check for duplicate name
    const existingPeriod = await prismaClient.period.findFirst({
      where: {
        name,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      select: { id: true },
    });

    if (existingPeriod) {
      throw new NameInUseError(`A period with name ${name} already exists.`);
    }

    const createdPeriod = await createPeriodWithRetry(
      {
        name,
        startDate,
        endDate,
        active,
      },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:periods:create",
      level: "info",
      message: "Period created successfully",
      traceId: req.traceId,
      duration,
      details: {
        periodId: createdPeriod.id,
        createdById: userAccount.id,
        name,
      },
      _references: {
        periodId: "Period",
        createdById: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      period: createdPeriod,
    });
  } catch (error: unknown) {
    if (error instanceof NameInUseError) {
      res.status(409).json({
        status: "period-name-in-use",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:periods:create",
        level: "error",
        message: "Prisma error during period creation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:periods:create",
        level: "error",
        message: "Error during period creation",
        traceId: req.traceId,
        details: {
          error: error.message,
          stack: error.stack,
        },
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
