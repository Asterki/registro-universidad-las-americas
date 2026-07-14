import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../shared/api/grades.js";

import LoggingService from "../../services/logging.js";
import {
  EnrollmentNotFoundError,
  NoGradesFoundError,
  publishFinalGradeWithRetry,
} from "../../services/grades/publish.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, GradesAPITypes.PublishFinalGradeRequestBody>,
  res: Response<GradesAPITypes.GradeResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { enrollmentId } = req.body;
  const userAccount = req.user!;

  try {
    const enrollment = await publishFinalGradeWithRetry(
      { enrollmentId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:publish",
      level: "info",
      message: "Final grade published successfully",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentId,
        finalGrade: enrollment.finalGrade?.toString(),
        publishedBy: userAccount.id,
      },
      _references: {
        enrollmentId: "Enrollment",
        publishedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      grade: enrollment,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof EnrollmentNotFoundError) {
      res.status(404).json({
        status: "enrollment-not-found",
      });
      return;
    }

    if (error instanceof NoGradesFoundError) {
      res.status(400).json({
        status: "grade-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:grades:publish",
        level: "error",
        message: "Prisma error during final grade publishing",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:publish",
        level: "error",
        message: "Error during final grade publishing",
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
