import { Request, Response, NextFunction } from "express";
import * as FacultyAPITypes from "../../../../shared/api/faculties.js";

import LoggingService from "../../services/logging.js";
import {
  FacultyNotFoundError,
  updateFacultyWithRetry,
} from "../../services/faculties/update.js";

import { Prisma } from "@prisma/client";
import prismaClient from "../../config/prisma.js";

class NameInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NameInUseError";
  }
}

class CodeInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CodeInUseError";
  }
}

const handler = async (
  req: Request<{}, {}, FacultyAPITypes.UpdateFacultyRequestBody>,
  res: Response<FacultyAPITypes.UpdateFacultyResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { facultyId, name, code, dean } = req.body;
  const userAccount = req.user!;

  try {
    // Check if faculty exists first
    const existingFaculty = await prismaClient.faculty.findFirst({
      where: {
        id: facultyId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      select: { id: true },
    });

    if (!existingFaculty) {
      throw new FacultyNotFoundError("Faculty not found or deleted");
    }

    // Check name uniqueness if changing
    if (name !== undefined && name !== null) {
      const existingName = await prismaClient.faculty.findFirst({
        where: {
          name,
          id: { not: facultyId },
          metadata: {
            is: {
              deleted: false,
            },
          },
        },
        select: { id: true },
      });

      if (existingName) {
        throw new NameInUseError(`A faculty with name "${name}" already exists.`);
      }
    }

    // Check code uniqueness if changing
    if (code !== undefined && code !== null) {
      const existingCode = await prismaClient.faculty.findFirst({
        where: {
          code,
          id: { not: facultyId },
          metadata: {
            is: {
              deleted: false,
            },
          },
        },
        select: { id: true },
      });

      if (existingCode) {
        throw new CodeInUseError(`A faculty with code "${code}" already exists.`);
      }
    }

    const updatedFaculty = await updateFacultyWithRetry(
      {
        facultyId,
        name,
        code,
        dean,
      },
      {
        traceId: req.traceId,
        userAccount: userAccount,
      },
    );

    const duration = performance.now() - start;
    LoggingService.log({
      source: "api:faculties:update",
      level: "info",
      message: "Faculty updated successfully",
      traceId: req.traceId,
      duration,
      details: {
        updatedById: userAccount.id,
        faculty: updatedFaculty.id,
      },
      _references: {
        updatedById: "Account",
        faculty: "Faculty",
      },
    });

    res.status(200).json({
      status: "success",
      faculty: updatedFaculty,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof FacultyNotFoundError) {
      res.status(404).json({ status: "faculty-not-found" });
      return;
    }

    if (error instanceof NameInUseError) {
      res.status(409).json({ status: "name-in-use" });
      return;
    }

    if (error instanceof CodeInUseError) {
      res.status(409).json({ status: "code-in-use" });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:faculties:update",
        level: "error",
        message: "Prisma error during faculty update",
        traceId: req.traceId,
        details: { code: error, meta: error },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:faculties:update",
        level: "error",
        message: "Error during faculty update",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
