import { Request, Response, NextFunction } from "express";

import * as CatalogsAPITypes from "../../../../shared/api/catalogs.js";

import LoggingService from "../../services/logging.js";
import { listCampuses } from "../../services/catalogs/indexes.js";

const handler = async (
  req: Request<{}, {}, CatalogsAPITypes.ListCampusesRequestBody>,
  res: Response<CatalogsAPITypes.ListCampusesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const campuses = await listCampuses({
      traceId: req.traceId,
      userAccount: req.user,
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:campus:list",
      level: "info",
      message: "Campuses listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        count: campuses.length,
      },
    });

    res.status(200).json({
      status: "success",
      campuses,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:campus:list",
        level: "error",
        message: "Error listing campuses",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
