import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as AccountProfilesAPITypes from "../../../../../shared/api/account-profiles.js";

import LoggingService from "../../../services/logging.js";
import {
  updateAccountWithRetry,
  AccountNotFoundError,
} from "../../../services/accounts/update.js";

import prismaClient from "../../../config/prisma.js";

class CampusNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampusNotFoundError";
  }
}

const handler = async (
  req: Request<{}, {}, AccountProfilesAPITypes.AssignInstructorCampusRequestBody>,
  res: Response<AccountProfilesAPITypes.CampusAssignmentResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { accountId, campusId } = req.body;
    const userAccount = req.user!;

    // Verify campus exists
    const campus = await prismaClient.campus.findUnique({
      where: { id: campusId, metadata: { is: { deleted: false } } },
      select: { id: true },
    });
    if (!campus) {
      throw new CampusNotFoundError(`Campus ${campusId} not found`);
    }

    // Verify account exists and update campusId
    const account = await prismaClient.account.update({
      where: { id: accountId },
      data: { campusId },
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:accounts:instructor:campus:assign",
      level: "info",
      message: "Instructor campus assigned successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountId,
        campusId,
      },
      _references: {
        accountId: "Account",
        campusId: "Campus",
      },
    });

    res.status(200).json({
      status: "success",
      account,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CampusNotFoundError) {
      res.status(404).json({
        status: "campus-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({
        status: "account-not-found",
      });
      return;
    }

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:accounts:instructor:campus:assign",
        level: "error",
        message: "Error assigning instructor campus",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
