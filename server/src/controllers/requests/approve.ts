import { Request, Response, NextFunction } from "express";

import * as RequestsAPITypes from "../../../../shared/api/requests.js";

import LoggingService from "../../services/logging.js";
import {
  approveRequest,
  RequestNotFoundError,
  InvalidStatusTransitionError,
} from "../../services/requests/workflow.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.ApproveRequestRequestBody>,
  res: Response<RequestsAPITypes.RequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { requestId, response } = req.body;
  const userAccount = req.user!;

  try {
    const updated = await approveRequest(
      { requestId, response },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:approve",
      level: "important",
      message: "Request approved",
      traceId: req.traceId,
      duration,
      details: {
        requestId,
        approvedBy: userAccount.id,
      },
      _references: {
        requestId: "Request",
        approvedBy: "Account",
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
        source: "api:requests:approve",
        level: "error",
        message: "Prisma error during request approval",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:approve",
        level: "error",
        message: "Error during request approval",
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
