import { Request, Response, NextFunction } from "express";

import * as AcademicHistoryAPITypes from "../../../../shared/api/academic-history.js";

import LoggingService from "../../services/logging.js";
import { getAcademicHistory, AccountNotFoundError } from "../../services/academic-history/get.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, AcademicHistoryAPITypes.GetMyAcademicHistoryRequestBody>,
  res: Response<AcademicHistoryAPITypes.AcademicHistoryResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const userAccount = req.user!;

  try {
    const history = await getAcademicHistory(
      { accountId: userAccount.id },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const totalCredits = history.reduce((sum, enrollment) => {
      return sum + (enrollment.course?.credits || 0);
    }, 0);

    const completedCourses = history.filter(
      (e) => e.status === "completed",
    ).length;
    const grades = history
      .filter((e) => e.finalGrade !== null)
      .map((e) => Number(e.finalGrade));
    const gpa =
      grades.length > 0
        ? grades.reduce((a, b) => a + b, 0) / grades.length
        : undefined;

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:academic-history:get-my",
      level: "info",
      message: "My academic history retrieved",
      traceId: req.traceId,
      duration,
      details: {
        accountId: userAccount.id,
        count: history.length,
      },
      _references: {
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      history,
      summary: {
        totalCredits,
        gpa,
        completedCourses,
      },
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof AccountNotFoundError) {
      res.status(404).json({
        status: "student-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:academic-history:get-my",
        level: "error",
        message: "Prisma error during academic history retrieval",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:academic-history:get-my",
        level: "error",
        message: "Error during academic history retrieval",
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
