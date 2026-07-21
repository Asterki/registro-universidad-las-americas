import { Request, Response, NextFunction } from "express";

import * as CoursesAPITypes from "../../../../shared/api/courses.js";

import prismaClient from "../../config/prisma.js";

import LoggingService from "../../services/logging.js";
import { getFieldsToPopulate, getFieldsToSelect } from "../../utils/prisma.js";

import { Prisma } from "@prisma/client";

type CourseSelect = Prisma.CourseSelect;
type CourseInclude = Prisma.CourseInclude;

const handler = async (
  req: Request<{}, {}, CoursesAPITypes.ListCoursesRequestBody>,
  res: Response<CoursesAPITypes.ListCoursesResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const { page, count, fields, populate, search, includeDeleted, filters } =
    req.body;

  try {
    const where: Prisma.CourseWhereInput = {};
    const fieldsToSelect = getFieldsToSelect<CourseSelect>(fields, {
      id: true,
      code: true,
      name: true,
    });
    const fieldsToPopulate = populate
      ? getFieldsToPopulate<
          CourseInclude,
          NonNullable<CoursesAPITypes.ListCoursesRequestBody["populate"]>
        >(populate, {
          "metadata.createdBy": ["id", "name"],
          "metadata.updatedBy": ["id", "name"],
          "metadata.deletedBy": ["id", "name"],
        })
      : {};

    if (search && search.query.length > 0 && search.searchIn.length > 0) {
      const searchConditions: Prisma.CourseWhereInput[] = search.searchIn.map(
        (field: any) => ({
          [field]: {
            contains: search.query,
          },
        }),
      );
      where.OR = searchConditions;
    }

    if (filters) {
      if (filters.facultyId !== undefined) {
        where.facultyId = filters.facultyId;
      }

      if (filters.periodId !== undefined) {
        where.periodId = filters.periodId;
      }

      if (filters.instructorId !== undefined) {
        where.instructors = {
          some: {
            id: filters.instructorId,
          },
        };
      }
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

    const [courses, totalCourses] = await Promise.all([
      prismaClient.course.findMany({
        where,
        skip: page * count,
        take: count,
        orderBy: {
          code: "asc",
        },
        select: {
          ...fieldsToSelect,
          ...fieldsToPopulate,
        },
      }),
      prismaClient.course.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      courses,
      totalCourses,
    });
  } catch (error: unknown) {
    console.log(error);
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:courses:list",
        level: "error",
        traceId: req.traceId,
        message: "Unexpected error during course listing",
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
    return;
  }
};

export default handler;
