import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../shared/api/grades.js";

import LoggingService from "../../services/logging.js";
import { listGradesWithRetry } from "../../services/grades/list.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.ListFacultyGradesRequestBody>,
  res: Response<GradesAPITypes.ListGradesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { facultyId } = req.body;
  const userAccount = req.user!;

  try {
    const grades = await listGradesWithRetry(
      { facultyId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:list-faculty",
      level: "info",
      message: "Listed grades for faculty",
      traceId: req.traceId,
      duration,
      details: {
        facultyId,
        count: grades.length,
        requestedBy: userAccount.id,
      },
      _references: {
        facultyId: "Faculty",
        requestedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      grades,
      total: grades.length,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:list-faculty",
        level: "error",
        message: "Error listing faculty grades",
        traceId: req.traceId,
        details: {
          error: error.message,
          stack: error.stack,
        },
        duration,
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
