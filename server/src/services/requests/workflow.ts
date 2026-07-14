import { performance } from "perf_hooks";
import retry from "async-retry";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  MetadataSource,
  MetadataStatus,
  Prisma,
  Request,
} from "@prisma/client";
type MetadataUpdateHistoryCreateWithoutMetadataInput =
  Prisma.MetadataUpdateHistoryCreateWithoutMetadataInput;

import LoggingService from "../../services/logging.js";

type RequestWorkflowOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class RequestNotFoundError extends Error {
  retryable = false;
  constructor(message = "request-not-found-or-deleted") {
    super(message);
    this.name = "RequestNotFoundError";
  }
}

export class InvalidStatusTransitionError extends Error {
  retryable = false;
  constructor(message = "invalid-status-transition") {
    super(message);
    this.name = "InvalidStatusTransitionError";
  }
}

export class RequestAlreadyResolvedError extends Error {
  retryable = false;
  constructor(message = "request-already-resolved") {
    super(message);
    this.name = "RequestAlreadyResolvedError";
  }
}

// ---- helpers ----

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["in_review", "approved", "rejected"],
  in_review: ["approved", "rejected", "pending"],
  approved: [],
  rejected: [],
};

function validateTransition(
  current: string,
  target: string,
): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new InvalidStatusTransitionError(
      `Cannot transition from "${current}" to "${target}"`,
    );
  }
}

async function getActiveRequest(
  requestId: string,
  includeUpdateHistory = false,
) {
  const request = await prismaClient.request.findUnique({
    where: {
      id: requestId,
      metadata: {
        is: {
          deleted: false,
        },
      },
    },
    include: {
      metadata: includeUpdateHistory
        ? { include: { updateHistory: true } }
        : true,
    },
  });

  if (!request) {
    throw new RequestNotFoundError();
  }

  return request;
}

function buildHistoryEntry(
  userAccountId: string | undefined,
  changes: Record<string, unknown>,
): MetadataUpdateHistoryCreateWithoutMetadataInput {
  const now = new Date();
  return {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    changes: changes as Prisma.InputJsonValue,
  };
}

// ---- approve ----

type ApproveRequestParameters = {
  requestId: string;
  response?: string;
};

export async function approveRequest(
  params: ApproveRequestParameters,
  options: RequestWorkflowOptions = {},
): Promise<Request> {
  const startTime = performance.now();
  const { requestId, response } = params;
  const userAccountId = options.userAccount?.id;

  const existing = await getActiveRequest(requestId, true);
  validateTransition(existing.status, "approved");

  const now = new Date();
  const historyEntry = buildHistoryEntry(userAccountId, {
    "request.status": "approved",
    "request.resolvedAt": now.toISOString(),
    ...(response !== undefined ? { "request.response": response } : {}),
    ...(userAccountId ? { "request.processedById": userAccountId } : {}),
  });

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  const updatePayload: Prisma.RequestUpdateInput = {
    status: "approved",
    resolvedAt: now,
    response: response ?? existing.response,
    processedBy: userAccountId
      ? { connect: { id: userAccountId } }
      : undefined,
    metadata: existing.metadata
      ? { update: metadataUpdatePayload }
      : {
          create: {
            documentVersion: 1,
            createdAt: now,
            createdById: userAccountId,
            updatedAt: now,
            updatedById: userAccountId,
            deleted: false,
            deletedAt: null,
            deletedById: null,
            status: MetadataStatus.active,
            source: MetadataSource.manual,
            notes: "",
            tags: "",
            updateHistory: { create: historyEntry },
          },
        },
  };

  try {
    const updated = await prismaClient.request.update({
      where: { id: requestId },
      data: updatePayload,
    });

    LoggingService.log({
      source: "services:requests:workflow",
      level: "important",
      message: "Request approved",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        requestId,
        resolvedBy: userAccountId,
      },
      _references: {
        requestId: "Request",
        ...(userAccountId ? { resolvedBy: "Account" } : {}),
      },
    });

    return updated;
  } catch (err: any) {
    throw err;
  }
}

// ---- reject ----

type RejectRequestParameters = {
  requestId: string;
  response: string;
};

export async function rejectRequest(
  params: RejectRequestParameters,
  options: RequestWorkflowOptions = {},
): Promise<Request> {
  const startTime = performance.now();
  const { requestId, response } = params;
  const userAccountId = options.userAccount?.id;

  const existing = await getActiveRequest(requestId, true);
  validateTransition(existing.status, "rejected");

  const now = new Date();
  const historyEntry = buildHistoryEntry(userAccountId, {
    "request.status": "rejected",
    "request.resolvedAt": now.toISOString(),
    "request.response": response,
    ...(userAccountId ? { "request.processedById": userAccountId } : {}),
  });

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  const updatePayload: Prisma.RequestUpdateInput = {
    status: "rejected",
    resolvedAt: now,
    response,
    processedBy: userAccountId
      ? { connect: { id: userAccountId } }
      : undefined,
    metadata: existing.metadata
      ? { update: metadataUpdatePayload }
      : {
          create: {
            documentVersion: 1,
            createdAt: now,
            createdById: userAccountId,
            updatedAt: now,
            updatedById: userAccountId,
            deleted: false,
            deletedAt: null,
            deletedById: null,
            status: MetadataStatus.active,
            source: MetadataSource.manual,
            notes: "",
            tags: "",
            updateHistory: { create: historyEntry },
          },
        },
  };

  try {
    const updated = await prismaClient.request.update({
      where: { id: requestId },
      data: updatePayload,
    });

    LoggingService.log({
      source: "services:requests:workflow",
      level: "important",
      message: "Request rejected",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        requestId,
        resolvedBy: userAccountId,
      },
      _references: {
        requestId: "Request",
        ...(userAccountId ? { resolvedBy: "Account" } : {}),
      },
    });

    return updated;
  } catch (err: any) {
    throw err;
  }
}

// ---- review ----

type ReviewRequestParameters = {
  requestId: string;
};

export async function reviewRequest(
  params: ReviewRequestParameters,
  options: RequestWorkflowOptions = {},
): Promise<Request> {
  const startTime = performance.now();
  const { requestId } = params;
  const userAccountId = options.userAccount?.id;

  const existing = await getActiveRequest(requestId, true);
  validateTransition(existing.status, "in_review");

  const now = new Date();
  const historyEntry = buildHistoryEntry(userAccountId, {
    "request.status": "in_review",
  });

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  const updatePayload: Prisma.RequestUpdateInput = {
    status: "in_review",
    metadata: existing.metadata
      ? { update: metadataUpdatePayload }
      : {
          create: {
            documentVersion: 1,
            createdAt: now,
            createdById: userAccountId,
            updatedAt: now,
            updatedById: userAccountId,
            deleted: false,
            deletedAt: null,
            deletedById: null,
            status: MetadataStatus.active,
            source: MetadataSource.manual,
            notes: "",
            tags: "",
            updateHistory: { create: historyEntry },
          },
        },
  };

  try {
    const updated = await prismaClient.request.update({
      where: { id: requestId },
      data: updatePayload,
    });

    LoggingService.log({
      source: "services:requests:workflow",
      level: "info",
      message: "Request moved to in_review",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: { requestId },
      _references: { requestId: "Request" },
    });

    return updated;
  } catch (err: any) {
    throw err;
  }
}

// ---- resolve ----

type ResolveRequestParameters = {
  requestId: string;
  status: "approved" | "rejected";
  response: string;
};

export async function resolveRequest(
  params: ResolveRequestParameters,
  options: RequestWorkflowOptions = {},
): Promise<Request> {
  if (params.status === "approved") {
    return approveRequest(
      { requestId: params.requestId, response: params.response },
      options,
    );
  }
  return rejectRequest(
    { requestId: params.requestId, response: params.response },
    options,
  );
}

// ---- assign ----

type AssignRequestParameters = {
  requestId: string;
  processedById: string;
};

export async function assignRequest(
  params: AssignRequestParameters,
  options: RequestWorkflowOptions = {},
): Promise<Request> {
  const startTime = performance.now();
  const { requestId, processedById } = params;
  const userAccountId = options.userAccount?.id;

  const existing = await getActiveRequest(requestId, true);

  const now = new Date();
  const historyEntry = buildHistoryEntry(userAccountId, {
    "request.processedById": processedById,
  });

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  const updatePayload: Prisma.RequestUpdateInput = {
    processedBy: { connect: { id: processedById } },
    metadata: existing.metadata
      ? { update: metadataUpdatePayload }
      : {
          create: {
            documentVersion: 1,
            createdAt: now,
            createdById: userAccountId,
            updatedAt: now,
            updatedById: userAccountId,
            deleted: false,
            deletedAt: null,
            deletedById: null,
            status: MetadataStatus.active,
            source: MetadataSource.manual,
            notes: "",
            tags: "",
            updateHistory: { create: historyEntry },
          },
        },
  };

  try {
    const updated = await prismaClient.request.update({
      where: { id: requestId },
      data: updatePayload,
    });

    LoggingService.log({
      source: "services:requests:workflow",
      level: "info",
      message: "Request assigned to processor",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: {
        requestId,
        assignedTo: processedById,
      },
      _references: {
        requestId: "Request",
        assignedTo: "Account",
      },
    });

    return updated;
  } catch (err: any) {
    throw err;
  }
}

// ---- addResponse ----

type AddResponseParameters = {
  requestId: string;
  response: string;
};

export async function addResponse(
  params: AddResponseParameters,
  options: RequestWorkflowOptions = {},
): Promise<Request> {
  const startTime = performance.now();
  const { requestId, response } = params;
  const userAccountId = options.userAccount?.id;

  const existing = await getActiveRequest(requestId, true);

  const now = new Date();
  const historyEntry = buildHistoryEntry(userAccountId, {
    "request.response": response,
  });

  const metadataUpdatePayload: Prisma.MetadataUpdateInput = {
    updatedAt: now,
    updatedBy: userAccountId ? { connect: { id: userAccountId } } : undefined,
    updateHistory: { create: historyEntry },
  };

  const updatePayload: Prisma.RequestUpdateInput = {
    response,
    metadata: existing.metadata
      ? { update: metadataUpdatePayload }
      : {
          create: {
            documentVersion: 1,
            createdAt: now,
            createdById: userAccountId,
            updatedAt: now,
            updatedById: userAccountId,
            deleted: false,
            deletedAt: null,
            deletedById: null,
            status: MetadataStatus.active,
            source: MetadataSource.manual,
            notes: "",
            tags: "",
            updateHistory: { create: historyEntry },
          },
        },
  };

  try {
    const updated = await prismaClient.request.update({
      where: { id: requestId },
      data: updatePayload,
    });

    LoggingService.log({
      source: "services:requests:workflow",
      level: "info",
      message: "Response added to request",
      traceId: options.traceId,
      duration: Number((performance.now() - startTime).toFixed(3)),
      details: { requestId },
      _references: { requestId: "Request" },
    });

    return updated;
  } catch (err: any) {
    throw err;
  }
}
