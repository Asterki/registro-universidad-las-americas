import { Request, Response, NextFunction } from "express";

import * as RequestsAPITypes from "../../../../shared/api/requests.js";

import LoggingService from "../../services/logging.js";
import {
  addResponse,
  RequestNotFoundError,
} from "../../services/requests/workflow.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.AddRequestResponseRequestBody>,
  res: Response<RequestsAPITypes.RequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { requestId, response } = req.body;
  const userAccount = req.user!;

  try {
    const updated = await addResponse(
      { requestId, response },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:add-response",
      level: "info",
      message: "Response added to request",
      traceId: req.traceId,
      duration,
      details: {
        requestId,
        updatedBy: userAccount.id,
      },
      _references: {
        requestId: "Request",
        updatedBy: "Account",
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
        source: "api:requests:add-response",
        level: "error",
        message: "Prisma error during adding response to request",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:add-response",
        level: "error",
        message: "Error during adding response to request",
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
