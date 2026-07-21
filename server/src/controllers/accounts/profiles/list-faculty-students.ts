import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as AccountProfilesAPITypes from "../../../../../shared/api/account-profiles.js";

import LoggingService from "../../../services/logging.js";

import prismaClient from "../../../config/prisma.js";

const handler = async (
  req: Request<{}, {}, AccountProfilesAPITypes.ListFacultyStudentsRequestBody>,
  res: Response<AccountProfilesAPITypes.ListFacultyAccountsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { facultyId, page = 0, count = 20 } = req.body;

    const where: Prisma.AccountWhereInput = {
      facultyId,
      role: {
        name: "student",
      },
      metadata: {
        is: {
          deleted: false,
        },
      },
    };

    const [accounts, total] = await Promise.all([
      prismaClient.account.findMany({
        where,
        skip: page * count,
        take: count,
        orderBy: {
          name: "asc",
        },
      }),
      prismaClient.account.count({ where }),
    ]);

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:accounts:list:students:faculty",
      level: "info",
      message: "Faculty students listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        facultyId,
        page,
        limit: count,
        total,
      },
    });

    res.status(200).json({
      status: "success",
      accounts,
      total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:accounts:list:students:faculty",
        level: "error",
        message: "Error listing faculty students",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
