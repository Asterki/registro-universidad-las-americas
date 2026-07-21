import { Request, Response, NextFunction } from "express";
import * as AccountRolesAPITypes from "../../../../../shared/api/account-roles.js";

import LoggingService from "../../../services/logging.js";
import {
  AccountRoleNotFoundError,
  updateAccountRoleWithRetry,
} from "../../../services/account-roles/update.js";

import { Prisma } from "@prisma/client";
import prismaClient from "../../../config/prisma.js";

class LevelInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LevelInUseError";
  }
}

const handler = async (
  req: Request<{}, {}, AccountRolesAPITypes.UpdateRequestBody>,
  res: Response<AccountRolesAPITypes.UpdateResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { roleId, name, description, level, requiresTwoFactor, permissions } =
    req.body;
  const userAccount = req.user!;

  try {
    if (level !== undefined && level !== null) {
      const existingRole = await prismaClient.accountRole.findFirst({
        where: {
          level,
          id: { not: roleId },
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
    }

    const updatedRole = await updateAccountRoleWithRetry(
      {
        roleId,
        name,
        description,
        level,
        requiresTwoFactor,
        permissions,
      },
      {
        traceId: req.traceId,
        userAccount: userAccount,
      },
    );

    const duration = performance.now() - start;
    LoggingService.log({
      source: "api:account-roles:update",
      level: "info",
      message: "Account role updated successfully",
      traceId: req.traceId,
      duration,
      details: {
        updatedById: userAccount.id,
        accountRole: updatedRole.id,
      },
      _references: {
        updatedById: "Account",
        accountRoleId: "AccountRole",
      },
    });

    res.status(200).json({
      status: "success",
      accountRole: updatedRole,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof AccountRoleNotFoundError) {
      res.status(404).json({ status: "role-not-found" });
      return;
    }

    if (error instanceof LevelInUseError) {
      res.status(409).json({ status: "level-in-use" });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      LoggingService.log({
        source: "api:account-roles:update",
        level: "error",
        message: "Prisma error during account role update",
        traceId: req.traceId,
        details: { code: error, meta: error },
        duration,
      });
    } else if (error instanceof Error) {
      LoggingService.log({
        source: "api:account-roles:update",
        level: "error",
        message: "Error during account role update",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
