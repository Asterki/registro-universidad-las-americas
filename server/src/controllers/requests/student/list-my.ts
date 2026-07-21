import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as RequestsAPITypes from "../../../../../shared/api/requests.js";

import LoggingService from "../../../services/logging.js";

import prismaClient from "../../../config/prisma.js";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.ListMyRequestsRequestBody>,
  res: Response<RequestsAPITypes.ListRequestsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { page = 0, count = 20, status } = req.body;
  const userAccount = req.user!;

  try {
    const where: Prisma.RequestWhereInput = {
      accountId: userAccount.id,
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    if (status !== undefined) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prismaClient.request.findMany({
        where,
        skip: page * count,
        take: count,
        orderBy: {
          date: "desc",
        },
      }),
      prismaClient.request.count({ where }),
    ]);

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:requests:student:list-my",
      level: "info",
      message: "My requests listed",
      traceId: req.traceId,
      duration,
      details: {
        accountId: userAccount.id,
        page,
        limit: count,
        total,
        ...(status ? { status } : {}),
      },
      _references: {
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      requests,
      total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:requests:student:list-my",
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
        source: "api:requests:student:list-my",
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
