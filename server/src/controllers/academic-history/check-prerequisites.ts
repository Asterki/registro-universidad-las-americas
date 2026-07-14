import { Request, Response, NextFunction } from "express";

import * as AcademicHistoryAPITypes from "../../../../shared/api/academic-history.js";

import LoggingService from "../../services/logging.js";
import {
  checkPrerequisites,
  CourseNotFoundError,
  AccountNotFoundError,
} from "../../services/academic-history/prerequisites.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, AcademicHistoryAPITypes.CheckPrerequisitesRequestBody>,
  res: Response<AcademicHistoryAPITypes.PrerequisitesResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseId, accountId } = req.body;
  const userAccount = req.user!;

  try {
    const result = await checkPrerequisites(
      { courseId, accountId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:academic-history:check-prerequisites",
      level: result.passed ? "info" : "warning",
      message: result.passed
        ? "Prerequisites check passed"
        : "Prerequisites check failed",
      traceId: req.traceId,
      duration,
      details: {
        courseId,
        accountId,
        passed: result.passed,
      },
      _references: {
        courseId: "Course",
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: result.passed ? "valid" : "invalid",
      met: result.passed,
      missingPrerequisites: result.prerequisites.filter((p) => !p.completed),
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CourseNotFoundError) {
      res.status(404).json({
        status: "course-not-found",
      });
      return;
    }

    if (error instanceof AccountNotFoundError) {
      res.status(404).json({
        status: "student-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:academic-history:check-prerequisites",
        level: "error",
        message: "Prisma error during prerequisites check",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:academic-history:check-prerequisites",
        level: "error",
        message: "Error during prerequisites check",
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
