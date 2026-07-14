import { Request, Response, NextFunction } from "express";

import * as RequestsAPITypes from "../../../../shared/api/requests.js";

import LoggingService from "../../services/logging.js";
import { createRequestWithRetry } from "../../services/requests/create.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.CreateRequestForStudentRequestBody>,
  res: Response<RequestsAPITypes.RequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { accountId, facultyId, type, description } = req.body;
  const userAccount = req.user!;

  try {
    const request = await createRequestWithRetry(
      {
        accountId,
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
      source: "api:requests:create-for-student",
      level: "info",
      message: "Request created for student",
      traceId: req.traceId,
      duration,
      details: {
        requestId: request.id,
        accountId,
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
        source: "api:requests:create-for-student",
        level: "error",
        message: "Prisma error during request creation for student",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:create-for-student",
        level: "error",
        message: "Error during request creation for student",
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
