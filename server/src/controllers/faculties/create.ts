import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as FacultyAPITypes from "../../../../shared/api/faculties.js";

import LoggingService from "../../services/logging.js";
import { createFacultyWithRetry } from "../../services/faculties/create.js";

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

class CampusNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampusNotFoundError";
  }
}

const handler = async (
  req: Request<{}, {}, FacultyAPITypes.CreateFacultyRequestBody>,
  res: Response<FacultyAPITypes.CreateFacultyResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { campusId, name, code, dean } = req.body;

  const userAccount = req.user!; // We can assert this because the route should be protected by authentication middleware

  try {
    // Check campus exists
    const campus = await prismaClient.campus.findFirst({
      where: {
        id: campusId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      select: { id: true },
    });

    if (!campus) {
      throw new CampusNotFoundError(`Campus with id ${campusId} not found.`);
    }

    // Check name uniqueness
    const existingName = await prismaClient.faculty.findFirst({
      where: {
        name,
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

    // Check code uniqueness
    const existingCode = await prismaClient.faculty.findFirst({
      where: {
        code,
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

    const createdFaculty = await createFacultyWithRetry(
      {
        campusId,
        name,
        code,
        dean,
      },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:faculties:create",
      level: "info",
      message: "Faculty created successfully",
      traceId: req.traceId,
      duration,
      details: {
        facultyId: createdFaculty.id,
        createdById: userAccount.id,
        name,
        code,
      },
      _references: {
        facultyId: "Faculty",
        createdById: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      faculty: createdFaculty,
    });
  } catch (error: unknown) {
    if (error instanceof NameInUseError) {
      res.status(409).json({
        status: "name-in-use",
      });
      return;
    }

    if (error instanceof CodeInUseError) {
      res.status(409).json({
        status: "code-in-use",
      });
      return;
    }

    if (error instanceof CampusNotFoundError) {
      res.status(404).json({
        status: "campus-not-found",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:faculties:create",
        level: "error",
        message: "Prisma error during faculty creation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:faculties:create",
        level: "error",
        message: "Error during faculty creation",
        traceId: req.traceId,
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
