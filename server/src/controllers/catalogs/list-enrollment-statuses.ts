import { Request, Response, NextFunction } from "express";

import * as CatalogsAPITypes from "../../../../shared/api/catalogs.js";

import LoggingService from "../../services/logging.js";
import { listEnrollmentStatuses } from "../../services/catalogs/indexes.js";

const handler = async (
  req: Request<{}, {}, CatalogsAPITypes.ListEnrollmentStatusesRequestBody>,
  res: Response<CatalogsAPITypes.ListStatusesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const statuses = await listEnrollmentStatuses({
      traceId: req.traceId,
      userAccount: req.user,
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollment-status:list",
      level: "info",
      message: "Enrollment statuses listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        count: statuses.length,
      },
    });

    res.status(200).json({
      status: "success",
      statuses,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollment-status:list",
        level: "error",
        message: "Error listing enrollment statuses",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
