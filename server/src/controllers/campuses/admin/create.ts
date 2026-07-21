import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as CampusAPITypes from "../../../../../shared/api/campus.js";

import LoggingService from "../../../services/logging.js";
import { createCampusWithRetry } from "../../../services/campus/create.js";

const handler = async (
  req: Request<{}, {}, CampusAPITypes.CreateRequestBody>,
  res: Response<CampusAPITypes.CreateResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { name, city, address, phone } = req.body;

  const userAccount = req.user!;

  try {
    const createdCampus = await createCampusWithRetry(
      {
        name,
        city,
        address,
        phone,
        createdAt: new Date(),
      },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:campus:create",
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
        campusId: "Campus",
        createdById: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      campus: createdCampus,
    });
  } catch (error: unknown) {
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
