import { Request, Response, NextFunction } from "express";

import * as RegistryAPITypes from "../../../../shared/api/registry.js";

import LoggingService from "../../services/logging.js";
import {
  processAcademicRequestWithRetry,
  RequestNotFoundError,
  InvalidRequestActionError,
} from "../../services/registry/requests.js";

const handler = async (
  req: Request<{}, {}, RegistryAPITypes.ProcessAcademicRequestRequestBody>,
  res: Response<RegistryAPITypes.ProcessRequestResponse>,
  _next: NextFunction,
) => {
  const start = performance.now();

  try {
    const { requestId, action, response } = req.body;
    const userAccount = req.user!;

    const updatedRequest = await processAcademicRequestWithRetry(
      { requestId, action, response },
      {
        traceId: req.traceId,
        userAccount,
      },
    );

    const duration = performance.now() - start;

    LoggingService.log({
      source: "api:registry:requests:process",
      level: "info",
      message: `Academic request ${action}d successfully`,
      traceId: req.traceId,
      duration,
      details: {
        requestId,
        action,
        status: updatedRequest.status,
      },
      _references: {
        requestId: "Request",
      },
    });

    res.status(200).json({
      status: "success",
      request: updatedRequest,
    });
  } catch (error: unknown) {
    const duration = performance.now() - start;

    if (error instanceof RequestNotFoundError) {
      res.status(404).json({
        status: "request-not-found",
      });
      return;
    }

    if (error instanceof InvalidRequestActionError) {
      res.status(400).json({
        status: "invalid-action",
      });
      return;
    }

    if (error instanceof Error) {
      LoggingService.log({
        source: "api:registry:requests:process",
        level: "error",
        message: "Error processing academic request",
        traceId: req.traceId,
        details: { error: error.message, stack: error.stack },
        duration,
      });
    }

    res.status(500).json({ status: "internal-error" });
  }
};

export default handler;
