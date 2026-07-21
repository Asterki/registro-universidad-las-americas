import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as AccountProfilesAPITypes from "../../../../../shared/api/account-profiles.js";

import LoggingService from "../../../services/logging.js";

import prismaClient from "../../../config/prisma.js";

const handler = async (
  req: Request<{}, {}, AccountProfilesAPITypes.RemoveInstructorCampusRequestBody>,
  res: Response<AccountProfilesAPITypes.CampusAssignmentResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { accountId } = req.body;
    const userAccount = req.user!;

    const account = await prismaClient.account.update({
      where: { id: accountId },
      data: { campusId: null },
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:accounts:instructor:campus:remove",
      level: "info",
      message: "Instructor campus removed successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountId,
      },
      _references: {
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      account,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({
        status: "account-not-found",
      });
      return;
    }

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:accounts:instructor:campus:remove",
        level: "error",
        message: "Error removing instructor campus",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
