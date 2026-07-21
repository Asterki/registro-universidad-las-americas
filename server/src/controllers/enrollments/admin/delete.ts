import { Request, Response, NextFunction } from "express";

import LoggingService from "../../../services/logging.js";
import {
  EnrollmentNotFoundError,
  deleteEnrollmentWithRetry,
} from "../../../services/enrollments/delete.js";

import { Prisma } from "@prisma/client";

type AdminDeleteEnrollmentRequestBody = {
  enrollmentId: string;
};

type AdminDeleteEnrollmentResponseData = {
  status: string;
  enrollment?: any;
};

const handler = async (
  req: Request<{}, {}, AdminDeleteEnrollmentRequestBody>,
  res: Response<AdminDeleteEnrollmentResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { enrollmentId } = req.body;
  const userAccount = req.user!;

  try {
    const deletedEnrollment = await deleteEnrollmentWithRetry(enrollmentId, {
      traceId: req.traceId,
      userAccount,
    });

    res.status(200).json({
      status: "success",
      enrollment: deletedEnrollment,
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
        source: "api:enrollments:admin:delete",
        level: "error",
        message: "Prisma error during enrollment deletion",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollments:admin:delete",
        level: "error",
        message: "Error during enrollment deletion",
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
