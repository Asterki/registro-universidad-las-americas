import { Request, Response, NextFunction } from "express";

import * as FacultiesAPITypes from "../../../../../shared/api/faculties.js";

import prismaClient from "../../../config/prisma.js";

import LoggingService from "../../../services/logging.js";
import { getFieldsToPopulate, getFieldsToSelect } from "../../../utils/prisma.js";

import { Prisma } from "@prisma/client";

type FacultySelect = Prisma.FacultySelect;
type FacultyInclude = Prisma.FacultyInclude;

const handler = async (
  req: Request<{}, {}, FacultiesAPITypes.ListFacultiesRequestBody>,
  res: Response<FacultiesAPITypes.ListFacultiesResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { page, count, fields, populate, search, includeDeleted, campusId, coordinatorId } =
    req.body;

  try {
    const where: Prisma.FacultyWhereInput = {};
    const fieldsToSelect = getFieldsToSelect<FacultySelect>(fields, {
      id: true,
      name: true,
      code: true,
    });
    const fieldsToPopulate = populate
      ? getFieldsToPopulate<
          FacultyInclude,
          NonNullable<FacultiesAPITypes.ListFacultiesRequestBody["populate"]>
        >(populate, {
          "metadata.createdBy": ["id", "name"],
          "metadata.updatedBy": ["id", "name"],
          "metadata.deletedBy": ["id", "name"],
        })
      : {};

    if (search && search.query.length > 0 && search.searchIn.length > 0) {
      const searchConditions: Prisma.FacultyWhereInput[] = search.searchIn.map(
        (field: any) => ({
          [field]: {
            contains: search.query,
          },
        }),
      );
      where.OR = searchConditions;
    }

    if (campusId !== undefined) {
      where.campusId = campusId;
    }

    if (coordinatorId !== undefined) {
      where.coordinators = {
        some: {
          id: coordinatorId,
        },
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

    const [faculties, totalFaculties] = await Promise.all([
      prismaClient.faculty.findMany({
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
      prismaClient.faculty.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      faculties,
      totalFaculties,
    });
  } catch (error: unknown) {
    console.log(error);
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:faculties:list",
        level: "error",
        traceId: req.traceId,
        message: "Unexpected error during faculty listing",
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
    return;
  }
};

export default handler;
