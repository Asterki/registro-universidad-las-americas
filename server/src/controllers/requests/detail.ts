import { Request, Response, NextFunction } from "express";

import * as RequestsAPITypes from "../../../../shared/api/requests.js";

import LoggingService from "../../services/logging.js";
import {
  getRequestDetail,
  RequestNotFoundError,
} from "../../services/requests/detail.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.GetRequestDetailRequestBody>,
  res: Response<RequestsAPITypes.RequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { requestId } = req.body;
  const userAccount = req.user!;

  try {
    const request = await getRequestDetail(
      { requestId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:detail",
      level: "info",
      message: "Request detail retrieved",
      traceId: req.traceId,
      duration,
      details: {
        requestId,
        status: request.status,
        type: request.type,
      },
      _references: {
        requestId: "Request",
      },
    });

    res.status(200).json({
      status: "success",
      request,
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
        source: "api:requests:detail",
        level: "error",
        message: "Prisma error during request detail retrieval",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:detail",
        level: "error",
        message: "Error during request detail retrieval",
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
