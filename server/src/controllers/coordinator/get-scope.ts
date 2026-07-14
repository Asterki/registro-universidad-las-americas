import { Request, Response, NextFunction } from "express";

import * as CoordinatorAPITypes from "../../../../shared/api/coordinator.js";

import LoggingService from "../../services/logging.js";
import { getCoordinatorFacultyScope, CoordinatorNotFoundError } from "../../services/coordinator/scope.js";

const handler = async (
  req: Request<{}, {}, CoordinatorAPITypes.GetCoordinatorFacultyScopeRequestBody>,
  res: Response<CoordinatorAPITypes.CoordinatorScopeResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const userAccount = req.user!;

    const coordinator = await getCoordinatorFacultyScope(
      { accountId: (userAccount as any).id },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:coordinator:scope:get",
      level: "info",
      message: "Coordinator scope retrieved successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountId: (userAccount as any).id,
        facultyId: coordinator.facultyId,
      },
    });

    res.status(200).json({
      status: "success",
      faculty: coordinator,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CoordinatorNotFoundError) {
      res.status(404).json({
        status: "not-coordinator",
      });
      return;
    }

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:coordinator:scope:get",
        level: "error",
        message: "Error getting coordinator scope",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
