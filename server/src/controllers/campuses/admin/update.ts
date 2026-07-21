import { Request, Response, NextFunction } from "express";
import * as CampusAPITypes from "../../../../../shared/api/campus.js";

import LoggingService from "../../../services/logging.js";
import {
  CampusNotFoundError,
  updateCampusWithRetry,
} from "../../../services/campus/update.js";

import { Prisma } from "@prisma/client";

const handler = async (
  req: Request<{}, {}, CampusAPITypes.UpdateRequestBody>,
  res: Response<CampusAPITypes.UpdateResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { campusId, name, city, address, phone } = req.body;
  const userAccount = req.user!;

  try {
    const updatedCampus = await updateCampusWithRetry(
      {
        campusId,
        name,
        city,
        address,
        phone,
      },
      {
        traceId: req.traceId,
        userAccount: userAccount,
      },
    );

    const duration = performance.now() - start;
    LoggingService.log({
      source: "api:campus:update",
      level: "info",
      message: "Campus updated successfully",
      traceId: req.traceId,
      duration,
      details: {
        updatedById: userAccount.id,
        campus: updatedCampus.id,
      },
      _references: {
        updatedById: "Account",
        campus: "Campus",
      },
    });

    res.status(200).json({
      status: "success",
      campus: updatedCampus,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof CampusNotFoundError) {
      res.status(404).json({ status: "campus-not-found" });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:campus:update",
        level: "error",
        message: "Prisma error during campus update",
        traceId: req.traceId,
        details: { code: error, meta: error },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:campus:update",
        level: "error",
        message: "Error during campus update",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
