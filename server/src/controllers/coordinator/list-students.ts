import { Request, Response, NextFunction } from "express";

import * as CoordinatorAPITypes from "../../../../shared/api/coordinator.js";

import LoggingService from "../../services/logging.js";
import { listCoordinatorStudents, CoordinatorNotFoundError } from "../../services/coordinator/students.js";

const handler = async (
  req: Request<{}, {}, CoordinatorAPITypes.ListCoordinatorStudentsRequestBody>,
  res: Response<CoordinatorAPITypes.CoordinatorStudentsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const userAccount = req.user!;
    const { page, count } = req.body;

    const result = await listCoordinatorStudents(
      { accountId: (userAccount as any).id, page, limit: count },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:coordinator:students:list",
      level: "info",
      message: "Coordinator students listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountId: (userAccount as any).id,
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });

    res.status(200).json({
      status: "success",
      students: result.data,
      total: result.total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CoordinatorNotFoundError) {
      res.status(404).json({
        status: "internal-error",
      });
      return;
    }

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:coordinator:students:list",
        level: "error",
        message: "Error listing coordinator students",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
