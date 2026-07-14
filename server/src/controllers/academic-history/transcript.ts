import { Request, Response, NextFunction } from "express";

import * as AcademicHistoryAPITypes from "../../../../shared/api/academic-history.js";

import LoggingService from "../../services/logging.js";
import { getAcademicHistory, AccountNotFoundError } from "../../services/academic-history/get.js";

import prismaClient from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, AcademicHistoryAPITypes.GetTranscriptRequestBody>,
  res: Response<AcademicHistoryAPITypes.TranscriptResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { accountId } = req.body;
  const userAccount = req.user!;

  try {
    const history = await getAcademicHistory(
      { accountId },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const student = await prismaClient.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        name: true,
        email: true,
        accountNumber: true,
      },
    });

    if (!student) {
      throw new AccountNotFoundError();
    }

    const transcript = {
      student,
      enrollments: history,
      generatedAt: new Date().toISOString(),
    };

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:academic-history:transcript",
      level: "info",
      message: "Transcript generated",
      traceId: req.traceId,
      duration,
      details: {
        accountId,
        enrollmentCount: history.length,
      },
      _references: {
        accountId: "Account",
      },
    });

    res.status(200).json({
      status: "success",
      transcript,
      student,
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
        source: "api:academic-history:transcript",
        level: "error",
        message: "Prisma error during transcript generation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:academic-history:transcript",
        level: "error",
        message: "Error during transcript generation",
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
