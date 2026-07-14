import { Request, Response, NextFunction } from "express";

import * as AccountProfilesAPITypes from "../../../../shared/api/account-profiles.js";

import LoggingService from "../../services/logging.js";
import { assignInstructorCampusWithRetry, InstructorCampusNotFoundError } from "../../services/account-profiles/campus.js";

const handler = async (
  req: Request<{}, {}, AccountProfilesAPITypes.AssignInstructorCampusRequestBody>,
  res: Response<AccountProfilesAPITypes.CampusAssignmentResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { accountId, campusId } = req.body;
    const userAccount = req.user!;

    const account = await assignInstructorCampusWithRetry(
      { accountId, campusId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

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

    if (error instanceof InstructorCampusNotFoundError) {
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
