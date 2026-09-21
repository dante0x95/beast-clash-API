import cors from "cors";
import { type RequestHandler } from "express";

const PREFLIGHT_MAX_AGE_SECONDS = 600;

/** Only the listed origins get CORS headers; an empty list disables cross-origin browser access. */
export function createCorsMiddleware(
  allowedOrigins: readonly string[],
): RequestHandler {
  return cors({
    origin: [...allowedOrigins],
    // browsers hide non-safelisted response headers from cross-origin scripts unless exposed
    exposedHeaders: ["Location", "X-Request-Id"],
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
  });
}
