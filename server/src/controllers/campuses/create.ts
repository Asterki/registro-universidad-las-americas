import { Request, Response, NextFunction } from "express";
import { AccountRole, Prisma } from "@prisma/client";

import * as CampusAPITypes from "../../../../shared/api/campus.js";

import LoggingService from "../../services/logging.js";
import { createCampusWithRetry } from "../../services/campus/create.js";

import prismaClient from "../../config/prisma.js";

class NameInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NameInUseError";
  }
}

const handler = async (
  req: Request<{}, {}, CampusAPITypes.CreateRequestBody>,
  res: Response<CampusAPITypes.CreateResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { name, address, city,
    createdAt, phone
  } = req.body;

  const userAccount = req.user!; // We can assert this because the route should be protected by authentication middleware

  try {
    const existingCampus = await prismaClient.accountRole.findFirst({
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

    if (existingCampus) {
      throw new NameInUseError(`A campus with name ${name} already exists.`);
    }

    const createdCampus = await createCampusWithRetry(
      {
        name,
        address,
        city, createdAt, phone
      },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:campuses:create",
      level: "info",
      message: "Campus created successfully",
      traceId: req.traceId,
      duration,
      details: {
        campusId: createdCampus.id,
        createdById: userAccount.id,
        name,
      },
      _references: {
        accountRo: "Campus",
        createdById: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      campus: createdCampus,
    });
  } catch (error: unknown) {
    if (error instanceof NameInUseError) {
      res.status(409).json({
        status: "name-in-use",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:campus:create",
        level: "error",
        message: "Prisma error during campus creation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:campus:create",
        level: "error",
        message: "Error during campus creation",
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
