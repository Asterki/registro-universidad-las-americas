import { Request, Response, NextFunction } from "express";

import * as RequestsAPITypes from "../../../../../shared/api/requests.js";

import LoggingService from "../../../services/logging.js";
import { createRequestWithRetry } from "../../../services/requests/create.js";

import prismaClient from "../../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.CreateMyRequestRequestBody>,
  res: Response<RequestsAPITypes.RequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { facultyId, type, description } = req.body;
  const userAccount = req.user!;

  try {
    const request = await createRequestWithRetry(
      {
        accountId: userAccount.id,
        facultyId,
        type,
        description,
      },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:student:create",
      level: "info",
      message: "Request created by student successfully",
      traceId: req.traceId,
      duration,
      details: {
        requestId: request.id,
        accountId: userAccount.id,
        facultyId,
        type,
      },
      _references: {
        requestId: "Request",
        accountId: "Account",
        facultyId: "Faculty",
      },
    });

    res.status(201).json({
      status: "success",
      request,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:requests:student:create",
        level: "error",
        message: "Prisma error during request creation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:student:create",
        level: "error",
        message: "Error during request creation",
        traceId: req.traceId,
        details: {
          error: error.message,
          stack: error.stack,
        },
        duration,
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
