import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import * as AccountRolesAPITypes from "../../../../../shared/api/account-roles.js";

import LoggingService from "../../../services/logging.js";
import { createAccountRoleWithRetry } from "../../../services/account-roles/create.js";

import prismaClient from "../../../config/prisma.js";

class LevelInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LevelInUseError";
  }
}

const handler = async (
  req: Request<{}, {}, AccountRolesAPITypes.CreateRequestBody>,
  res: Response<AccountRolesAPITypes.CreateResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { name, description, level } = req.body;

  const userAccount = req.user!;

  try {
    // Check level uniqueness
    const existingRole = await prismaClient.accountRole.findFirst({
      where: {
        level,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      select: { id: true },
    });

    if (existingRole) {
      throw new LevelInUseError(`A role with level ${level} already exists.`);
    }

    const createdRole = await createAccountRoleWithRetry(
      {
        name,
        description,
        level,
        isSystemRole: false,
        requiresTwoFactor: false,
        permissions: [],
      },
      {
        userAccount,
        traceId: req.traceId,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:account-roles:create",
      level: "info",
      message: "Account role created successfully",
      traceId: req.traceId,
      duration,
      details: {
        accountRoleId: createdRole.id,
        createdById: userAccount.id,
        name,
        level,
      },
      _references: {
        accountRoleId: "AccountRole",
        createdById: "Account",
      },
    });

    res.status(201).json({
      status: "success",
      accountRole: createdRole,
    });
  } catch (error: unknown) {
    if (error instanceof LevelInUseError) {
      res.status(409).json({
        status: "level-in-use",
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:account-roles:create",
        level: "error",
        message: "Prisma error during account role creation",
        traceId: req.traceId,
        details: {
          code: error,
          meta: error,
        },
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:account-roles:create",
        level: "error",
        message: "Error during account role creation",
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
