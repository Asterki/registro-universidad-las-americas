import { Request, Response, NextFunction } from "express";

import LoggingService from "../../../services/logging.js";
import prismaClient from "../../../config/prisma.js";

import { Prisma } from "@prisma/client";

type EnrollmentSelect = Prisma.EnrollmentSelect;
type EnrollmentInclude = Prisma.EnrollmentInclude;

import { getFieldsToPopulate, getFieldsToSelect } from "../../../utils/prisma.js";

type AdminListEnrollmentsRequestBody = {
  page: number;
  count: number;
  status?: "active" | "cancelled" | "completed" | "failed";
  periodId?: string;
  courseId?: string;
  accountId?: string;
  fields?: string[];
  populate?: string[];
  includeDeleted?: boolean;
};

type AdminListEnrollmentsResponseData = {
  status: string;
  enrollments?: any[];
  total?: number;
};

const handler = async (
  req: Request<{}, {}, AdminListEnrollmentsRequestBody>,
  res: Response<AdminListEnrollmentsResponseData>,
  _next: NextFunction,
) => {
  const start = performance.now();
  const {
    page,
    count,
    status,
    periodId,
    courseId,
    accountId,
    fields,
    populate,
    includeDeleted,
  } = req.body;

  try {
    const where: Prisma.EnrollmentWhereInput = {};
    const fieldsToSelect = getFieldsToSelect<EnrollmentSelect>(fields, {
      id: true,
      accountId: true,
      courseId: true,
      periodId: true,
      status: true,
    });
    const fieldsToPopulate = populate
      ? getFieldsToPopulate<
          EnrollmentInclude,
          NonNullable<AdminListEnrollmentsRequestBody["populate"]>
        >(populate, {
          "metadata.createdBy": ["id", "name"],
          "metadata.updatedBy": ["id", "name"],
          "metadata.deletedBy": ["id", "name"],
        })
      : {};

    if (status !== undefined) {
      where.status = status;
    }

    if (periodId !== undefined) {
      where.periodId = periodId;
    }

    if (courseId !== undefined) {
      where.courseId = courseId;
    }

    if (accountId !== undefined) {
      where.accountId = accountId;
    }

    if (!includeDeleted) {
      where.metadata = {
        is: {
          deleted: false,
        },
      };
    }

    const effectivePage = page ?? 0;
    const effectiveCount = count ?? 50;

    const [enrollments, total] = await Promise.all([
      prismaClient.enrollment.findMany({
        where,
        skip: effectivePage * effectiveCount,
        take: effectiveCount,
        orderBy: {
          registeredAt: "desc",
        },
        select: {
          ...fieldsToSelect,
          ...fieldsToPopulate,
        },
      }),
      prismaClient.enrollment.count({ where }),
    ]);

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:enrollments:admin:list",
      level: "info",
      message: "Listed enrollments",
      traceId: req.traceId,
      duration,
      details: {
        total,
        page: effectivePage,
        filters: { status, periodId, courseId, accountId },
      },
    });

    res.status(200).json({
      status: "success",
      enrollments,
      total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:enrollments:admin:list",
        level: "error",
        message: "Error listing enrollments",
        traceId: req.traceId,
        details: {
          error: error.message,
          stack: error.stack,
        },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
    return;
  }
};

export default handler;
