import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import { Account, Faculty, Prisma } from "@prisma/client";

import LoggingService from "../../services/logging.js";

type ListFacultyParameters = {
  page: number;
  count: number;
  includeDeleted?: boolean;
  campusId?: string;
  search?: {
    query: string;
    searchIn: ("name" | "code")[];
  };
  fields?: string[];
  populate?: string[];
};

type ListFacultyOptions = {
  traceId?: string;
  userAccount?: Account;
};

export type ListFacultyResult = {
  faculties: Faculty[];
  totalFaculties: number;
};

type FacultySelect = Prisma.FacultySelect;
type FacultyInclude = Prisma.FacultyInclude;

import { getFieldsToPopulate, getFieldsToSelect } from "../../utils/prisma.js";

export async function listFaculties(
  params: ListFacultyParameters,
  options: ListFacultyOptions = {},
): Promise<ListFacultyResult> {
  const startTime = performance.now();
  const { page, count, includeDeleted, campusId, search, fields, populate } =
    params;

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
        NonNullable<typeof populate>
      >(populate, {
        "metadata.createdBy": ["id", "name"],
        "metadata.updatedBy": ["id", "name"],
        "metadata.deletedBy": ["id", "name"],
      })
      : {};

    if (campusId) {
      where.campusId = campusId;
    }

    if (search && search.query.length > 0 && search.searchIn.length > 0) {
      where.OR = search.searchIn.map((field) => ({
        [field]: {
          contains: search.query,
        },
      })) as Prisma.FacultyWhereInput[];
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

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:faculty:list",
      level: "info",
      message: "Faculties listed",
      traceId: options.traceId,
      duration,
      details: {
        total: totalFaculties,
        returned: faculties.length,
        page,
        count,
      },
    });

    return { faculties, totalFaculties };
  } catch (error: any) {
    LoggingService.log({
      source: "services:faculty:list",
      level: "error",
      message: "Error listing faculties",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        error: error?.message,
        stack: error?.stack,
      },
    });

    throw error;
  }
}
