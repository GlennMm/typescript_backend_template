import type { NextFunction, Response } from "express";
import type { AuthRequest, Role } from "../types";
import { verifyAccessToken } from "../utils/jwt";
import { errorResponse } from "../utils/response";

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "Authentication required", 401, "UNAUTHORIZED");
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
      tenantId: payload.tenantId,
    };

    next();
  } catch (error) {
    return errorResponse(res, "Invalid or expired token", 401, "INVALID_TOKEN");
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, "Authentication required", 401, "UNAUTHORIZED");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        "You do not have permission to access this resource",
        403,
        "FORBIDDEN",
      );
    }

    next();
  };
}

// Middleware to ensure the user belongs to the current tenant
export function ensureTenantUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return errorResponse(res, "Authentication required", 401, "UNAUTHORIZED");
  }

  if (!req.tenant) {
    return errorResponse(
      res,
      "Tenant context required",
      400,
      "TENANT_CONTEXT_MISSING",
    );
  }

  // Super admins can access any tenant
  if (req.user.role === "SuperAdmin") {
    return next();
  }

  // Tenant users must belong to the current tenant
  if (req.user.tenantId !== req.tenant.tenantId) {
    return errorResponse(
      res,
      "You do not have access to this tenant",
      403,
      "TENANT_ACCESS_DENIED",
    );
  }

  next();
}
