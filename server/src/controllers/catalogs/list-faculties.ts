import { Request, Response, NextFunction } from "express";

import * as CatalogsAPITypes from "../../../../shared/api/catalogs.js";

import LoggingService from "../../services/logging.js";
import { listFaculties } from "../../services/catalogs/indexes.js";

const handler = async (
  req: Request<{}, {}, CatalogsAPITypes.ListFacultiesRequestBody>,
  res: Response<CatalogsAPITypes.ListFacultiesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const faculties = await listFaculties({
      traceId: req.traceId,
      userAccount: req.user,
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:faculty:list",
      level: "info",
      message: "Faculties listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        count: faculties.length,
      },
    });

    res.status(200).json({
      status: "success",
      faculties,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:faculty:list",
        level: "error",
        message: "Error listing faculties",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
