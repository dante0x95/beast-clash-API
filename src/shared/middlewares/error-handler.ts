import { type NextFunction, type Request, type Response } from "express";

import { AppError, ValidationError } from "../errors/app-error.js";

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    issues?: ValidationError["issues"];
  };
}

/** express.json() rejects malformed bodies with an http-error tagged with this type. */
function isMalformedJsonError(error: unknown): boolean {
  return (
    error instanceof SyntaxError
    && "type" in error
    && error.type === "entity.parse.failed"
  );
}

/** express.json() rejects bodies over its limit with an http-error tagged with this type. */
function isPayloadTooLargeError(error: unknown): boolean {
  return (
    error instanceof Error
    && "type" in error
    && error.type === "entity.too.large"
  );
}

export function notFoundHandler(req: Request, res: Response<ErrorBody>): void {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response<ErrorBody>,
  _next: NextFunction,
): void {
  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message, issues: error.issues },
    });
    return;
  }

  if (error instanceof AppError) {
    res
      .status(error.statusCode)
      .json({ error: { code: error.code, message: error.message } });
    return;
  }

  if (isMalformedJsonError(error)) {
    res
      .status(400)
      .json({
        error: {
          code: "INVALID_JSON",
          message: "Request body is not valid JSON",
        },
      });
    return;
  }

  if (isPayloadTooLargeError(error)) {
    res
      .status(413)
      .json({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Request body is too large",
        },
      });
    return;
  }

  // Unexpected: log the real cause, never leak it to the client
  req.log.error({ err: error }, "unhandled error");
  res
    .status(500)
    .json({
      error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
    });
}
