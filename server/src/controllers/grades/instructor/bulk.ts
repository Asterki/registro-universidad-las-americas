import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../../shared/api/grades.js";

import LoggingService from "../../../services/logging.js";
import { createGradeWithRetry } from "../../../services/grades/create.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.BulkRecordGradesRequestBody>,
  res: Response<GradesAPITypes.BulkGradesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { grades } = req.body;
  const userAccount = req.user!;

  const results: { created: number; failed: number; errors: any[] } = {
    created: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < grades.length; i++) {
    const entry = grades[i];

    try {
      await createGradeWithRetry(
        {
          enrollmentId: entry.enrollmentId,
          description: entry.description,
          score: entry.score,
        },
        {
          traceId: req.traceId,
          userAccount,
        },
      );
      results.created++;
    } catch (err: any) {
      results.failed++;
      results.errors.push({
        index: i,
        enrollmentId: entry.enrollmentId,
        message: err?.message ?? "unknown-error",
      });
    }
  }

  const duration = performance.now() - start;

  LoggingService.log({
    source: "api:grades:instructor:bulk",
    level: "info",
    message: `Bulk grade recording by instructor completed: ${results.created} created, ${results.failed} failed`,
    traceId: req.traceId,
    duration,
    details: {
      total: grades.length,
      created: results.created,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
      recordedBy: userAccount.id,
    },
    _references: {
      recordedBy: "Account",
    },
  });

  res.status(201).json({
    status: "success",
    grades: results.created > 0 ? [{ count: results.created }] : undefined,
    errors: results.errors.length > 0 ? results.errors : undefined,
  });
};

export default handler;
