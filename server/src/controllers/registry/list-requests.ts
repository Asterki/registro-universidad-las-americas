import { Request, Response, NextFunction } from "express";

import * as RegistryAPITypes from "../../../../shared/api/registry.js";

import LoggingService from "../../services/logging.js";
import { listAllAcademicRequests } from "../../services/registry/requests.js";

const handler = async (
  req: Request<{}, {}, RegistryAPITypes.ListAllAcademicRequestsRequestBody>,
  res: Response<RegistryAPITypes.ListAllRequestsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { page, count, status, facultyId } = req.body;

    const result = await listAllAcademicRequests(
      { page, limit: count, status, facultyId } as any,
      {
        traceId: req.traceId,
        userAccount: req.user,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:registry:requests:list",
      level: "info",
      message: "Academic requests listed successfully",
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
      requests: result.data,
      total: result.total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:registry:requests:list",
        level: "error",
        message: "Error listing academic requests",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
