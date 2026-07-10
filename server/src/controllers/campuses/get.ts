import { Request, Response, NextFunction } from "express";
import prismaClient from "../../config/prisma.js";

import * as CampusAPITypes from "../../../../shared/api/campus.js";

import LoggingService from "../../services/logging.js";
import { Prisma } from "@prisma/client";

type CampusSelect = Prisma.CampusSelect;
type CampusInclude = Prisma.CampusInclude;

import { getFieldsToPopulate, getFieldsToSelect } from "../../utils/prisma.js";

const handler = async (
  req: Request<{}, {}, CampusAPITypes.GetRequestBody>,
  res: Response<CampusAPITypes.GetResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { campusIds, fields, populate } = req.body;

  try {
    let fieldsToSelect = getFieldsToSelect<CampusSelect>(fields, {
      id: true,
      name: true,
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

    const campuses = await prismaClient.campus.findMany({
      where: {
        id: {
          in: campusIds,
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
      campuses,
    });
  } catch (error: unknown) {
    console.log(error);
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:campus:get",
        level: "error",
        message: "Error during campus retrieval",
        traceId: req.traceId,
        duration,
        details: {
          error: error.message,
          stack: error.stack,
          campusIds,
        },
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
