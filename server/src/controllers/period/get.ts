import { Request, Response, NextFunction } from "express";
import prismaClient from "../../config/prisma.js";

import * as PeriodAPITypes from "../../../../shared/api/period.js";

import LoggingService from "../../services/logging.js";
import { Prisma } from "@prisma/client";

type PeriodSelect = Prisma.PeriodSelect;
type PeriodInclude = Prisma.PeriodInclude;

import { getFieldsToPopulate, getFieldsToSelect } from "../../utils/prisma.js";

const handler = async (
  req: Request<{}, {}, PeriodAPITypes.GetPeriodRequestBody>,
  res: Response<PeriodAPITypes.ListAllPeriodsResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { periodIds, fields, populate } = req.body;

  try {
    let fieldsToSelect = getFieldsToSelect<PeriodSelect>(fields, {
      id: true,
      name: true,
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

    const periods = await prismaClient.period.findMany({
      where: {
        id: {
          in: periodIds,
        },
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      select: {
        ...fieldsToSelect,
        ...fieldsToPopulate,
      },
    });

    res.status(200).json({
      status: "success",
      periods,
    });
  } catch (error: unknown) {
    console.log(error);
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:periods:get",
        level: "error",
        message: "Error during period retrieval",
        traceId: req.traceId,
        duration,
        details: {
          error: error.message,
          stack: error.stack,
          periodIds,
        },
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
