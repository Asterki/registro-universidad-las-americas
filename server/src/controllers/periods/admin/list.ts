import { Request, Response, NextFunction } from "express";

import * as PeriodAPITypes from "../../../../../shared/api/period.js";

import prismaClient from "../../../config/prisma.js";

import LoggingService from "../../../services/logging.js";
import { getFieldsToPopulate, getFieldsToSelect } from "../../../utils/prisma.js";

import { Prisma } from "@prisma/client";

type PeriodSelect = Prisma.PeriodSelect;
type PeriodInclude = Prisma.PeriodInclude;

const handler = async (
  req: Request<{}, {}, PeriodAPITypes.ListAllPeriodsRequestBody>,
  res: Response<PeriodAPITypes.ListAllPeriodsResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { page, count, fields, populate, includeDeleted, active, name } =
    req.body;

  try {
    const where: Prisma.PeriodWhereInput = {};
    const fieldsToSelect = getFieldsToSelect<PeriodSelect>(fields, {
      id: true,
      name: true,
      active: true,
      startDate: true,
      endDate: true,
    });
    const fieldsToPopulate = populate
      ? getFieldsToPopulate<
          PeriodInclude,
          NonNullable<PeriodAPITypes.ListAllPeriodsRequestBody["populate"]>
        >(populate, {
          "metadata.createdBy": ["id", "name"],
          "metadata.updatedBy": ["id", "name"],
          "metadata.deletedBy": ["id", "name"],
        })
      : {};

    if (active !== undefined) {
      where.active = active;
    }

    if (name !== undefined) {
      where.name = {
        contains: name,
      };
    }

    if (!includeDeleted) {
      where.metadata = {
        is: {
          deleted: {
            not: true,
          },
        },
      };
    }

    const [periods, totalPeriods] = await Promise.all([
      prismaClient.period.findMany({
        where,
        skip: page * count,
        take: count,
        orderBy: {
          startDate: "desc",
        },
        select: {
          ...fieldsToSelect,
          ...fieldsToPopulate,
        },
      }),
      prismaClient.period.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      periods,
      totalPeriods,
    });
  } catch (error: unknown) {
    console.log(error);
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:periods:list",
        level: "error",
        traceId: req.traceId,
        message: "Unexpected error during period listing",
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
    return;
  }
};

export default handler;
