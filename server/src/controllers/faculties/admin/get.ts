import { Request, Response, NextFunction } from "express";
import prismaClient from "../../../config/prisma.js";

import * as FacultiesAPITypes from "../../../../../shared/api/faculties.js";

import LoggingService from "../../../services/logging.js";
import { Prisma } from "@prisma/client";

type FacultySelect = Prisma.FacultySelect;
type FacultyInclude = Prisma.FacultyInclude;

import { getFieldsToPopulate, getFieldsToSelect } from "../../../utils/prisma.js";

const handler = async (
  req: Request<{}, {}, FacultiesAPITypes.GetFacultyRequestBody>,
  res: Response<FacultiesAPITypes.GetFacultyResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { facultyIds, fields, populate } = req.body;

  try {
    let fieldsToSelect = getFieldsToSelect<FacultySelect>(fields, {
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

    const faculties = await prismaClient.faculty.findMany({
      where: {
        id: {
          in: facultyIds,
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
      faculties,
    });
  } catch (error: unknown) {
    console.log(error);
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:faculties:get",
        level: "error",
        message: "Error during faculty retrieval",
        traceId: req.traceId,
        duration,
        details: {
          error: error.message,
          stack: error.stack,
          facultyIds,
        },
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
