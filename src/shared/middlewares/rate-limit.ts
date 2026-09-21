import { type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";

import { TooManyRequestsError } from "../errors/app-error.js";

export interface RateLimitConfig {
  /** Max requests per client (by IP) within the window. */
  limit: number;
  windowMs: number;
}

/** In-memory, per-process limiter: good enough for a single instance, not shared across replicas. */
export function createRateLimitMiddleware({
  limit,
  windowMs,
}: RateLimitConfig): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // delegate to errorHandler so a 429 uses the same error body as every other failure
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError());
    },
  });
}
