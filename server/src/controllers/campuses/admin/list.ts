import { Request, Response, NextFunction } from "express";

import * as CampusAPITypes from "../../../../../shared/api/campus.js";

import prismaClient from "../../../config/prisma.js";

import LoggingService from "../../../services/logging.js";
import { getFieldsToPopulate, getFieldsToSelect } from "../../../utils/prisma.js";

import { Prisma } from "@prisma/client";

type CampusSelect = Prisma.CampusSelect;
type CampusInclude = Prisma.CampusInclude;

const handler = async (
  req: Request<{}, {}, CampusAPITypes.ListRequestBody>,
  res: Response<CampusAPITypes.ListResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { page, count, fields, populate, search, includeDeleted } = req.body;

  try {
    const where: Prisma.CampusWhereInput = {};
    const fieldsToSelect = getFieldsToSelect<CampusSelect>(fields, {
      id: true,
      name: true,
      city: true,
    });
    const fieldsToPopulate = populate
      ? getFieldsToPopulate<
          CampusInclude,
          NonNullable<CampusAPITypes.ListRequestBody["populate"]>
        >(populate, {
          "metadata.createdBy": ["id", "name"],
          "metadata.updatedBy": ["id", "name"],
          "metadata.deletedBy": ["id", "name"],
        })
      : {};

    if (search && search.query.length > 0 && search.searchIn.length > 0) {
      where.OR = search.searchIn.map((field) => ({
        [field]: {
          contains: search.query,
        },
      })) as Prisma.CampusWhereInput[];
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

    const [campuses, totalCampuses] = await Promise.all([
      prismaClient.campus.findMany({
        where,
        skip: page * count,
        take: count,
        orderBy: {
          name: "asc",
        },
        select: {
          ...fieldsToSelect,
          ...fieldsToPopulate,
        },
      }),
      prismaClient.campus.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      campuses,
      totalCampuses,
    });
  } catch (error: unknown) {
    console.log(error);
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:campus:list",
        level: "error",
        traceId: req.traceId,
        message: "Unexpected error during campus listing",
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
    return;
  }
};

export default handler;
