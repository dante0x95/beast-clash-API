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
