import { Request, Response, NextFunction } from "express";
import prismaClient from "../../../config/prisma.js";

import LoggingService from "../../../services/logging.js";

const handler = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const accountId = req.user!.id;

    const account = await prismaClient.account.findUnique({
      where: {
        id: accountId,
      },
      include: {
        role: true,
        campus: true,
        faculty: true,
      },
    });

    if (!account) {
      res.status(404).json({
        status: "account-not-found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      account,
    });
  } catch (error: unknown) {
    console.log(error);
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:accounts:get-my-profile",
        level: "error",
        message: "Error during profile retrieval",
        traceId: req.traceId,
        duration,
        details: {
          error: error.message,
          stack: error.stack,
        },
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
