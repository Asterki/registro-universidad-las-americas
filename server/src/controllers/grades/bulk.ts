import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../shared/api/grades.js";

import LoggingService from "../../services/logging.js";
import { bulkRecordGradesWithRetry } from "../../services/grades/bulk.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.BulkRecordGradesRequestBody>,
  res: Response<GradesAPITypes.BulkGradesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { grades } = req.body;
  const userAccount = req.user!;

  try {
    // Add default date for each grade entry
    const gradesWithDate = grades.map((g) => ({
      ...g,
      date: new Date(),
    }));

    const result = await bulkRecordGradesWithRetry(
      { grades: gradesWithDate },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:bulk",
      level: "info",
      message: `Bulk grade recording completed: ${result.created} created, ${result.failed} failed`,
      traceId: req.traceId,
      duration,
      details: {
        total: grades.length,
        created: result.created,
        failed: result.failed,
        errors: result.errors.length > 0 ? result.errors : undefined,
        recordedBy: userAccount.id,
      },
      _references: {
        recordedBy: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      grades: result.created > 0 ? [{ count: result.created }] : undefined,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:bulk",
        level: "error",
        message: "Error during bulk grade recording",
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
