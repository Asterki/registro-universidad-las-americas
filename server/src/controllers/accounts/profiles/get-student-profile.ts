import { Request, Response, NextFunction } from "express";
import prismaClient from "../../../config/prisma.js";

import * as AccountProfilesAPITypes from "../../../../../shared/api/account-profiles.js";

import LoggingService from "../../../services/logging.js";

const handler = async (
  req: Request<{}, {}, AccountProfilesAPITypes.GetStudentProfileRequestBody>,
  res: Response<AccountProfilesAPITypes.ProfileResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { accountId } = req.body;

    const account = await prismaClient.account.findUnique({
      where: {
        id: accountId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      include: {
        role: true,
        faculty: true,
        enrollments: {
          include: {
            course: true,
            period: true,
            grades: true,
          },
        },
      },
    });

    if (!account) {
      const duration = performance.now() - start;

      LoggingService.log({
        source: "api:accounts:profile:student",
        level: "info",
        message: "Student profile not found",
        traceId: req.traceId,
        duration,
        details: {
          accountId,
        },
      });

      res.status(404).json({
        status: "account-not-found",
      });
      return;
    }

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:accounts:profile:student",
      level: "info",
      message: "Student profile retrieved successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountId: account.id,
      },
    });

    res.status(200).json({
      status: "success",
      account,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:accounts:profile:student",
        level: "error",
        message: "Error retrieving student profile",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
