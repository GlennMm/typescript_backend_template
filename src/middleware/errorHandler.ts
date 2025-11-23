import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../utils/logger";
import { errorResponse } from "../utils/response";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  logger.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    return errorResponse(
      res,
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      err.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    );
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, "Invalid token", 401, "INVALID_TOKEN");
  }

  if (err.name === "TokenExpiredError") {
    return errorResponse(res, "Token expired", 401, "TOKEN_EXPIRED");
  }

  // Default error
  return errorResponse(
    res,
    err.message || "Internal server error",
    500,
    "INTERNAL_SERVER_ERROR",
  );
}
