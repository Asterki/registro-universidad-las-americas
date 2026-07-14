import { Request, Response, NextFunction } from "express";

import * as RequestsAPITypes from "../../../../shared/api/requests.js";

import LoggingService from "../../services/logging.js";
import { listRequests } from "../../services/requests/list.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.ListMyRequestsRequestBody>,
  res: Response<RequestsAPITypes.ListRequestsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { page, limit, status, type } = req.body;
  const userAccount = req.user!;

  try {
    const result = await listRequests(
      {
        page,
        limit,
        status,
        type,
        accountId: userAccount.id,
      },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:list-my",
      level: "info",
      message: "My requests listed",
      traceId: req.traceId,
      duration,
      details: {
        accountId: userAccount.id,
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      _references: {
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      requests: result.requests,
      total: result.total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:requests:list-my",
        level: "error",
        message: "Prisma error during my requests listing",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:list-my",
        level: "error",
        message: "Error during my requests listing",
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
