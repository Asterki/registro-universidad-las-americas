import { Request, Response, NextFunction } from "express";
import prismaClient from "../../../config/prisma.js";

import * as CourseAPITypes from "../../../../../shared/api/courses.js";

import LoggingService from "../../../services/logging.js";
import { Prisma } from "@prisma/client";

type CourseSelect = Prisma.CourseSelect;
type CourseInclude = Prisma.CourseInclude;

import { getFieldsToPopulate, getFieldsToSelect } from "../../../utils/prisma.js";

const handler = async (
  req: Request<{}, {}, CourseAPITypes.GetCourseRequestBody>,
  res: Response<CourseAPITypes.ListCoursesResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { courseIds, fields, populate } = req.body;

  try {
    let fieldsToSelect = getFieldsToSelect<CourseSelect>(fields, {
      id: true,
      code: true,
      name: true,
    });
    const fieldsToPopulate = populate
      ? getFieldsToPopulate<
        CourseInclude,
        NonNullable<CourseAPITypes.ListCoursesRequestBody["populate"]>
      >(populate, {
        "metadata.createdBy": ["id", "name"],
        "metadata.updatedBy": ["id", "name"],
        "metadata.deletedBy": ["id", "name"],
      })
      : {};

    const courses = await prismaClient.course.findMany({
      where: {
        id: {
          in: courseIds,
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
      courses,
    });
  } catch (error: unknown) {
    console.log(error);
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:admin:get",
        level: "error",
        message: "Error during course retrieval",
        traceId: req.traceId,
        duration,
        details: {
          error: error.message,
          stack: error.stack,
          courseIds,
        },
      });
    }

    res.status(500).json({
      status: "internal-error",
    });
  }
};

export default handler;
