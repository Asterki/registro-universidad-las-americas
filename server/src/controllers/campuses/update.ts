import { Request, Response, NextFunction } from "express";
import * as CampusAPITypes from "../../../../shared/api/campus.js";

import LoggingService from "../../services/logging.js";
import {
  CampusNotFoundError,
  updateCampusWithRetry,
} from "../../services/campus/update.js";

import { Prisma } from "@prisma/client";
import prismaClient from "../../config/prisma.js";

class NameInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NameInUseError";
  }
}

const handler = async (
  req: Request<{}, {}, CampusAPITypes.UpdateRequestBody>,
  res: Response<CampusAPITypes.UpdateResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { campusId, name, address, city, createdAt, phone } =
    req.body;
  const userAccount = req.user!;

  try {
    if (name !== undefined && name !== null) {
      const existingCampus = await prismaClient.campus.findFirst({
        where: {
          name,
          id: { not: campusId },
          metadata: {
            is: {
              deleted: false,
            },
          },
        },
        select: { id: true },
      });

      if (existingCampus) {
        throw new NameInUseError(`A campus with name "${name}" already exists.`);
      }
    }

    const campusToUpdate = await prismaClient.campus.findFirst({
      where: {
        id: campusId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      select: { id: true, level: true },
    });

    if (!campusToUpdate) {
      throw new CampusNotFoundError("Campus not found or deleted");
    }

    const updatedCampus = await updateCampusWithRetry(
      {
        campusId,
        name,
        address,
        city,
        createdAt,
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

    if (error instanceof NameInUseError) {
      res.status(409).json({ status: "name-in-use" });
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
