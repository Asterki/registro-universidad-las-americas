import { Request, Response, NextFunction } from "express";

import * as RequestsAPITypes from "../../../../shared/api/requests.js";

import LoggingService from "../../services/logging.js";
import {
  assignRequest,
  RequestNotFoundError,
} from "../../services/requests/workflow.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.AssignRequestRequestBody>,
  res: Response<RequestsAPITypes.RequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { requestId, assignedToId } = req.body;
  const userAccount = req.user!;

  try {
    const updated = await assignRequest(
      { requestId, processedById: assignedToId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:assign",
      level: "info",
      message: "Request assigned",
      traceId: req.traceId,
      duration,
      details: {
        requestId,
        assignedTo: assignedToId,
        assignedBy: userAccount.id,
      },
      _references: {
        requestId: "Request",
        assignedTo: "Account",
        assignedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      request: updated,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof RequestNotFoundError) {
      res.status(404).json({
        status: "request-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:requests:assign",
        level: "error",
        message: "Prisma error during request assignment",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:assign",
        level: "error",
        message: "Error during request assignment",
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
