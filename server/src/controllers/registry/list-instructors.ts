import { Request, Response, NextFunction } from "express";

import * as RegistryAPITypes from "../../../../shared/api/registry.js";

import LoggingService from "../../services/logging.js";
import { listAllInstructors } from "../../services/registry/instructors.js";

const handler = async (
  req: Request<{}, {}, RegistryAPITypes.ListAllInstructorsRequestBody>,
  res: Response<RegistryAPITypes.ListAllInstructorsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { facultyId, page, count } = req.body;

    const result = await listAllInstructors(
      { facultyId, page, limit: count },
      {
        traceId: req.traceId,
        userAccount: req.user,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:registry:instructors:list",
      level: "info",
      message: "All instructors listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });

    res.status(200).json({
      status: "success",
      instructors: result.data,
      total: result.total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:registry:instructors:list",
        level: "error",
        message: "Error listing all instructors",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
