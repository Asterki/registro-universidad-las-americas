import { Request, Response, NextFunction } from "express";

import * as GradesAPITypes from "../../../../../shared/api/grades.js";

import prismaClient from "../../../config/prisma.js";
import LoggingService from "../../../services/logging.js";

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
    // verify enrollment exists
    const enrollment = await prismaClient.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      res.status(404).json({
        status: "enrollment-not-found",
      });
      return;
    }

    // aggregate all active (non-deleted) grades for this enrollment
    const grades: { score: any }[] = await prismaClient.grade.findMany({
      where: {
        enrollmentId,
        metadata: {
          deleted: false,
        },
      },
      select: {
        score: true,
      },
    });

    if (grades.length === 0) {
      res.status(400).json({
        status: "grade-not-found",
      });
      return;
    }

    // calculate average
    const total = grades.reduce(
      (sum: number, g) => sum + Number(g.score),
      0,
    );
    const average = total / grades.length;
    const roundedAverage = Math.round(average * 100) / 100; // 2 decimal places

    // update enrollment finalGrade directly via prisma
    const updated = await prismaClient.enrollment.update({
      where: { id: enrollmentId },
      data: {
        finalGrade: roundedAverage,
      },
    });

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:grades:admin:publish",
      level: "info",
      message: "Final grade published successfully",
      traceId: req.traceId,
      duration,
      details: {
        enrollmentId,
        finalGrade: roundedAverage.toString(),
        gradesAveraged: grades.length,
        publishedBy: userAccount.id,
      },
      _references: {
        enrollmentId: "Enrollment",
        publishedBy: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      grade: updated,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:grades:admin:publish",
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
        source: "api:grades:admin:publish",
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
