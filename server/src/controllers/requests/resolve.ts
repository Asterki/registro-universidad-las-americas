import { Request, Response, NextFunction } from "express";

import * as RequestsAPITypes from "../../../../shared/api/requests.js";

import LoggingService from "../../services/logging.js";
import {
  resolveRequest,
  RequestNotFoundError,
  InvalidStatusTransitionError,
} from "../../services/requests/workflow.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.ResolveRequestRequestBody>,
  res: Response<RequestsAPITypes.RequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { requestId, response } = req.body;
  const userAccount = req.user!;

  try {
    const updated = await resolveRequest(
      { requestId, response: response || "" },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:resolve",
      level: "important",
      message: `Request resolved as completed`,
      traceId: req.traceId,
      duration,
      details: {
        requestId,
        resolvedBy: userAccount.id,
      },
      _references: {
        requestId: "Request",
        resolvedBy: "Account",
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

    if (error instanceof InvalidStatusTransitionError) {
      res.status(409).json({
        status: "invalid-status-transition",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:requests:resolve",
        level: "error",
        message: "Prisma error during request resolution",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:resolve",
        level: "error",
        message: "Error during request resolution",
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
