import { Request, Response, NextFunction } from "express";

import * as EnrollmentAPITypes from "../../../../../shared/api/enrollment.js";

import LoggingService from "../../../services/logging.js";
import {
  EnrollmentExistsError,
  createEnrollmentWithRetry,
} from "../../../services/enrollments/create.js";

import { Prisma } from "@prisma/client";

import prismaClient from "../../../config/prisma.js";

const handler = async (
  req: Request<{}, {}, EnrollmentAPITypes.EnrollSelfRequestBody>,
  res: Response<EnrollmentAPITypes.EnrollResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId } = req.body;
  const userAccount = req.user!;

  try {
    // Look up the course to get the periodId
    const course = await prismaClient.course.findUnique({
      where: { id: courseId },
      select: { periodId: true },
    });

    if (!course) {
      res.status(404).json({
        status: "course-not-found",
      });
      return;
    }

    const periodId = course.periodId;

    const enrollment = await createEnrollmentWithRetry(
      { accountId: userAccount.id, courseId, periodId },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollments:student:enroll-self",
      level: "info",
      message: "Self-enrollment successful",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentId: enrollment.id,
        accountId: userAccount.id,
        courseId,
        periodId,
      },
      _references: {
        enrollmentId: "Enrollment",
        accountId: "Account",
        courseId: "Course",
        periodId: "Period",
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
        source: "api:enrollments:student:enroll-self",
        level: "error",
        message: "Prisma error during self-enrollment",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollments:student:enroll-self",
        level: "error",
        message: "Error during self-enrollment",
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
