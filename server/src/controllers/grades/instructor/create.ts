import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../../shared/api/grades.js";

import LoggingService from "../../../services/logging.js";
import {
  EnrollmentNotFoundError,
  createGradeWithRetry,
} from "../../../services/grades/create.js";

import prismaClient from "../../../config/prisma.js";
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
    // Validate enrollment exists and belongs to instructor's courses
    const enrollment = await prismaClient.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            instructors: true,
          },
        },
      },
    });

    if (!enrollment) {
      res.status(404).json({
        status: "enrollment-not-found",
      });
      return;
    }

    const isInstructor = enrollment.course.instructors.some(
      (inst) => inst.id === userAccount.id,
    );

    if (!isInstructor) {
      res.status(404).json({
        status: "enrollment-not-found",
      });
      return;
    }

    const grade = await createGradeWithRetry(
      { enrollmentId, description, score },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:instructor:create",
      level: "info",
      message: "Grade recorded by instructor successfully",
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:grades:instructor:create",
        level: "error",
        message: "Prisma error during grade recording by instructor",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:grades:instructor:create",
        level: "error",
        message: "Error during grade recording by instructor",
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
