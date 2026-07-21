import { Request, Response, NextFunction } from "express";

import LoggingService from "../../../services/logging.js";
import {
  EnrollmentNotFoundError,
  updateEnrollmentWithRetry,
} from "../../../services/enrollments/update.js";

import { Prisma } from "@prisma/client";

type AdminUpdateEnrollmentRequestBody = {
  enrollmentId: string;
  status?: "active" | "cancelled" | "completed" | "failed";
  finalGrade?: number;
};

type AdminUpdateEnrollmentResponseData = {
  status: string;
  enrollment?: any;
};

const handler = async (
  req: Request<{}, {}, AdminUpdateEnrollmentRequestBody>,
  res: Response<AdminUpdateEnrollmentResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { enrollmentId, status, finalGrade } = req.body;
  const userAccount = req.user!;

  try {
    const updatedEnrollment = await updateEnrollmentWithRetry(
      {
        enrollmentId,
        ...(status !== undefined ? { status } : {}),
        ...(finalGrade !== undefined ? { finalGrade } : {}),
      },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollments:admin:update",
      level: "info",
      message: "Enrollment updated by admin",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentId,
        status,
        finalGrade,
        updatedBy: userAccount.id,
      },
      _references: {
        enrollmentId: "Enrollment",
        updatedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      enrollment: updatedEnrollment,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof EnrollmentNotFoundError) {
      res.status(404).json({
        status: "enrollment-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:enrollments:admin:update",
        level: "error",
        message: "Prisma error during enrollment update",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollments:admin:update",
        level: "error",
        message: "Error during enrollment update",
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
