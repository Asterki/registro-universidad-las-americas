import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as RequestsAPITypes from "../../../../../shared/api/requests.js";

import LoggingService from "../../../services/logging.js";

import prismaClient from "../../../config/prisma.js";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.GetRequestDetailRequestBody>,
  res: Response<RequestsAPITypes.RequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { requestIds } = req.body;
  const userAccount = req.user!;

  try {
    const requests = await prismaClient.request.findMany({
      where: {
        id: {
          in: requestIds,
        },
      },
      include: {
        account: true,
        faculty: true,
        processedBy: true,
      },
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:admin:get",
      level: "info",
      message: "Request details retrieved",
      traceId: req.traceId,
      duration,
      details: {
        requestedIds: requestIds,
        count: requests.length,
        requestedBy: userAccount.id,
      },
      _references: {
        requestedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      request: {
        requests,
      },
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:requests:admin:get",
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
        source: "api:requests:admin:get",
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
