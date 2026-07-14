import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../shared/api/grades.js";

import LoggingService from "../../services/logging.js";
import {
  EnrollmentNotFoundError,
  GradeNotFoundError,
  recordGradeWithRetry,
} from "../../services/grades/record.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.RecordGradeRequestBody>,
  res: Response<GradesAPITypes.GradeResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { enrollmentId, description, score } = req.body;
  const userAccount = req.user!;

  try {
    const grade = await recordGradeWithRetry(
      { enrollmentId, description, score, date: new Date() },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:record",
      level: "info",
      message: "Grade recorded successfully",
      traceId: req.traceId,
      duration,
      details: {
        gradeId: grade.id,
        enrollmentId,
        score: score.toString(),
        recordedBy: userAccount.id,
      },
      _references: {
        gradeId: "Grade",
        enrollmentId: "Enrollment",
        recordedBy: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      grade,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof EnrollmentNotFoundError) {
      res.status(404).json({
        status: "enrollment-not-found",
      });
      return;
    }

    if (error instanceof GradeNotFoundError) {
      res.status(404).json({
        status: "grade-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:grades:record",
        level: "error",
        message: "Prisma error during grade recording",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:record",
        level: "error",
        message: "Error during grade recording",
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
