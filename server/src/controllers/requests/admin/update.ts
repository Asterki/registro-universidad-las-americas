import { Request, Response, NextFunction } from "express";

import * as RequestsAPITypes from "../../../../../shared/api/requests.js";

import LoggingService from "../../../services/logging.js";
import {
  updateRequestWithRetry,
  RequestNotFoundError,
} from "../../../services/requests/update.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.ApproveRequestRequestBody>,
  res: Response<RequestsAPITypes.RequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { requestId, status, response } = req.body as any;
  const userAccount = req.user!;

  try {
    const updated = await updateRequestWithRetry(
      {
        requestId,
        status,
        response: response ?? undefined,
        resolvedAt: status ? new Date() : undefined,
        processedById: userAccount.id,
      },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:admin:update",
      level: "important",
      message: "Request updated by admin",
      traceId: req.traceId,
      duration,
      details: {
        requestId,
        status: status ?? undefined,
        processedBy: userAccount.id,
      },
      _references: {
        requestId: "Request",
        processedBy: "Account",
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
        source: "api:requests:admin:update",
        level: "error",
        message: "Prisma error during request update",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:admin:update",
        level: "error",
        message: "Error during request update",
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
