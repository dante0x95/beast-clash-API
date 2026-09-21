/** Base class for expected errors that map to an HTTP response. Anything else is a 500. */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
}

export class NotFoundError extends AppError {
  override readonly name = "NotFoundError";
  readonly statusCode = 404;
  readonly code = "NOT_FOUND";

  constructor(resource: string, id: string) {
    super(`${resource} ${id} not found`);
  }
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export class ValidationError extends AppError {
  override readonly name = "ValidationError";
  readonly statusCode = 400;
  readonly code = "VALIDATION_ERROR";

  constructor(readonly issues: ValidationIssue[]) {
    super("Request validation failed");
  }
}
