import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as RequestsAPITypes from "../../../../../shared/api/requests.js";

import LoggingService from "../../../services/logging.js";

import prismaClient from "../../../config/prisma.js";

const handler = async (
  req: Request<{}, {}, RequestsAPITypes.ListRequestsRequestBody>,
  res: Response<RequestsAPITypes.ListRequestsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { page = 0, count = 20, status, facultyId, type } = req.body;
  const userAccount = req.user!;

  try {
    const where: Prisma.RequestWhereInput = {
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    if (status !== undefined) {
      where.status = status;
    }

    if (facultyId !== undefined) {
      where.facultyId = facultyId;
    }

    if (type !== undefined) {
      where.type = type;
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
      source: "api:requests:admin:list",
      level: "info",
      message: "Requests listed (admin)",
      traceId: req.traceId,
      duration,
      details: {
        page,
        limit: count,
        total,
        filters: {
          ...(status ? { status } : {}),
          ...(facultyId ? { facultyId } : {}),
          ...(type ? { type } : {}),
        },
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
        source: "api:requests:admin:list",
        level: "error",
        message: "Prisma error during requests listing",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:requests:admin:list",
        level: "error",
        message: "Error during requests listing",
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
