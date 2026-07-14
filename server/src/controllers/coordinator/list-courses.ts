import { Request, Response, NextFunction } from "express";

import * as CoordinatorAPITypes from "../../../../shared/api/coordinator.js";

import LoggingService from "../../services/logging.js";
import { listCoordinatorCourses, CoordinatorNotFoundError } from "../../services/coordinator/courses.js";

const handler = async (
  req: Request<{}, {}, CoordinatorAPITypes.ListCoordinatorCoursesRequestBody>,
  res: Response<CoordinatorAPITypes.CoordinatorCoursesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const userAccount = req.user!;

    const courses = await listCoordinatorCourses(
      { accountId: (userAccount as any).id },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:coordinator:courses:list",
      level: "info",
      message: "Coordinator courses listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountId: (userAccount as any).id,
        count: courses.length,
      },
    });

    res.status(200).json({
      status: "success",
      courses,
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
        source: "api:coordinator:courses:list",
        level: "error",
        message: "Error listing coordinator courses",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
