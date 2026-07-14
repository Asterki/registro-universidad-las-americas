import { Request, Response, NextFunction } from "express";

import * as CatalogsAPITypes from "../../../../shared/api/catalogs.js";

import LoggingService from "../../services/logging.js";
import { listFacultiesByCampus } from "../../services/catalogs/indexes.js";

const handler = async (
  req: Request<{}, {}, CatalogsAPITypes.ListFacultiesByCampusRequestBody>,
  res: Response<CatalogsAPITypes.ListFacultiesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { campusId } = req.body;

    const faculties = await listFacultiesByCampus(
      { campusId },
      {
        traceId: req.traceId,
        userAccount: req.user,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:faculty:list:campus",
      level: "info",
      message: "Faculties by campus listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        campusId,
        count: faculties.length,
      },
      _references: {
        campusId: "Campus",
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
        source: "api:faculty:list:campus",
        level: "error",
        message: "Error listing faculties by campus",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
