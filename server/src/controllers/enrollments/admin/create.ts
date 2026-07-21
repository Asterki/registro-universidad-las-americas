import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../../shared/api/enrollment.js";

import LoggingService from "../../../services/logging.js";
import {
  EnrollmentExistsError,
  createEnrollmentWithRetry,
} from "../../../services/enrollments/create.js";

import { Prisma } from "@prisma/client";

import prismaClient from "../../../config/prisma.js";

type AdminCreateEnrollmentRequestBody = {
  accountId: string;
  courseId: string;
};

type AdminCreateEnrollmentResponseData = {
  status: string;
  enrollment?: any;
};

const handler = async (
  req: Request<{}, {}, AdminCreateEnrollmentRequestBody>,
  res: Response<AdminCreateEnrollmentResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { accountId, courseId } = req.body;
  const userAccount = req.user!;

  try {
    // Look up the course to get the periodId
    const course = await prismaClient.course.findUnique({
      where: {
        id: courseId,
        metadata: {
          is: { deleted: false },
        },
      },
      select: { id: true, periodId: true },
    });

    if (!course) {
      res.status(404).json({
        status: "course-not-found",
      });
      return;
    }

    const enrollment = await createEnrollmentWithRetry(
      { accountId, courseId, periodId: course.periodId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollments:admin:create",
      level: "info",
      message: "Enrollment created by admin",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentId: enrollment.id,
        accountId,
        courseId,
        periodId: course.periodId,
        createdBy: userAccount.id,
      },
      _references: {
        enrollmentId: "Enrollment",
        accountId: "Account",
        courseId: "Course",
        periodId: "Period",
        createdBy: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      enrollment,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof EnrollmentExistsError) {
      res.status(409).json({
        status: "already-enrolled",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:enrollments:admin:create",
        level: "error",
        message: "Prisma error during enrollment creation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollments:admin:create",
        level: "error",
        message: "Error during enrollment creation",
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
