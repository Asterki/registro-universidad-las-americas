import { Request, Response, NextFunction } from "express";

import * as CatalogsAPITypes from "../../../../shared/api/catalogs.js";

import LoggingService from "../../services/logging.js";
import { listRoles } from "../../services/catalogs/indexes.js";

const handler = async (
  req: Request<{}, {}, CatalogsAPITypes.ListRolesRequestBody>,
  res: Response<CatalogsAPITypes.ListRolesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const roles = await listRoles({
      traceId: req.traceId,
      userAccount: req.user,
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:account-role:list",
      level: "info",
      message: "Roles listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        count: roles.length,
      },
    });

    res.status(200).json({
      status: "success",
      roles,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:account-role:list",
        level: "error",
        message: "Error listing roles",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
