import { Request, Response, NextFunction } from "express";

import * as AccountProfilesAPITypes from "../../../../shared/api/account-profiles.js";

import LoggingService from "../../services/logging.js";
import { listFacultyStudents } from "../../services/account-profiles/list.js";

const handler = async (
  req: Request<{}, {}, AccountProfilesAPITypes.ListFacultyStudentsRequestBody>,
  res: Response<AccountProfilesAPITypes.ListFacultyAccountsResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { facultyId, page, count } = req.body;

    const result = await listFacultyStudents(
      { facultyId, page, limit: count } as { facultyId: string; page?: number; limit?: number },
      {
        traceId: req.traceId,
        userAccount: req.user,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:accounts:list:students:faculty",
      level: "info",
      message: "Faculty students listed successfully",
      traceId: req.traceId,
      duration,
      details: {
        facultyId,
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });

    res.status(200).json({
      status: "success",
      accounts: result.data,
      total: result.total,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:accounts:list:students:faculty",
        level: "error",
        message: "Error listing faculty students",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
