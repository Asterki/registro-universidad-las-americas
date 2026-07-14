import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  AccountRole,
  Campus,
  Faculty,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

// ---- listCampuses ----

type ListCampusesOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listCampuses(
  options: ListCampusesOptions = {},
): Promise<Campus[]> {
  const startTime = performance.now();

  try {
    const campuses = await prismaClient.campus.findMany({
      where: {
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      include: {
        _count: {
          select: {
            faculties: true,
            accounts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:catalogs:listCampuses",
      level: "info",
      message: "Campuses listed",
      traceId: options.traceId,
      duration,
      details: {
        count: campuses.length,
      },
    });

    return campuses;
  } catch (err: any) {
    throw err;
  }
}

// ---- listFaculties ----

type ListFacultiesOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listFaculties(
  options: ListFacultiesOptions = {},
): Promise<Faculty[]> {
  const startTime = performance.now();

  try {
    const faculties = await prismaClient.faculty.findMany({
      where: {
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      include: {
        campus: true,
        _count: {
          select: {
            courses: true,
            accounts: true,
            coordinators: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:catalogs:listFaculties",
      level: "info",
      message: "Faculties listed",
      traceId: options.traceId,
      duration,
      details: {
        count: faculties.length,
      },
    });

    return faculties;
  } catch (err: any) {
    throw err;
  }
}

// ---- listFacultiesByCampus ----

type ListFacultiesByCampusParameters = {
  campusId: string;
};

type ListFacultiesByCampusOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listFacultiesByCampus(
  params: ListFacultiesByCampusParameters,
  options: ListFacultiesByCampusOptions = {},
): Promise<Faculty[]> {
  const startTime = performance.now();

  const { campusId } = params;

  try {
    const faculties = await prismaClient.faculty.findMany({
      where: {
        campusId,
        metadata: {
          is: {
            deleted: false,
          },
        },
      },
      include: {
        campus: true,
        _count: {
          select: {
            courses: true,
            accounts: true,
            coordinators: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:catalogs:listFacultiesByCampus",
      level: "info",
      message: "Faculties by campus listed",
      traceId: options.traceId,
      duration,
      details: {
        campusId,
        count: faculties.length,
      },
      _references: {
        campusId: "Campus",
      },
    });

    return faculties;
  } catch (err: any) {
    throw err;
  }
}

// ---- listRoles ----

type ListRolesOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listRoles(
  options: ListRolesOptions = {},
): Promise<AccountRole[]> {
  const startTime = performance.now();

  try {
    const roles = await prismaClient.accountRole.findMany({
      orderBy: {
        level: "asc",
      },
    });

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:catalogs:listRoles",
      level: "info",
      message: "Roles listed",
      traceId: options.traceId,
      duration,
      details: {
        count: roles.length,
      },
    });

    return roles;
  } catch (err: any) {
    throw err;
  }
}

// ---- listRequestStatuses ----

type ListRequestStatusesOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listRequestStatuses(
  options: ListRequestStatusesOptions = {},
): Promise<string[]> {
  const startTime = performance.now();

  const statuses = ["pending", "approved", "rejected", "in_review"];

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:catalogs:listRequestStatuses",
    level: "info",
    message: "Request statuses listed",
    traceId: options.traceId,
    duration,
    details: {
      count: statuses.length,
    },
  });

  return statuses;
}

// ---- listEnrollmentStatuses ----

type ListEnrollmentStatusesOptions = {
  traceId?: string;
  userAccount?: Account;
};

export async function listEnrollmentStatuses(
  options: ListEnrollmentStatusesOptions = {},
): Promise<string[]> {
  const startTime = performance.now();

  const statuses = ["active", "cancelled", "completed", "failed"];

  const duration = Number((performance.now() - startTime).toFixed(3));

  LoggingService.log({
    source: "services:catalogs:listEnrollmentStatuses",
    level: "info",
    message: "Enrollment statuses listed",
    traceId: options.traceId,
    duration,
    details: {
      count: statuses.length,
    },
  });

  return statuses;
}
