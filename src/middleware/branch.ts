import type { NextFunction, Response } from "express";
import { eq } from "drizzle-orm";
import { getTenantDb } from "../db/connection";
import { branches, staffAssignments } from "../db/schemas/tenant.schema";
import type { AuthRequest, BranchContext, Role } from "../types";
import { errorResponse } from "../utils/response";

/**
 * Middleware to resolve branch context from request
 * Looks for branchId in:
 * 1. X-Branch-ID header
 * 2. :branchId route parameter
 * 3. branchId query parameter
 */
export async function resolveBranchContext(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.tenant) {
      return errorResponse(
        res,
        "Tenant context required",
        400,
        "TENANT_CONTEXT_MISSING",
      );
    }

    // Try to get branchId from multiple sources
    const branchId =
      (req.headers["x-branch-id"] as string) ||
      req.params.branchId ||
      (req.query.branchId as string);

    if (!branchId) {
      // Branch context is optional, continue without it
      return next();
    }

    const db = getTenantDb(req.tenant.tenantId);

    // Fetch branch details
    const [branch] = await db
      .select({
        id: branches.id,
        code: branches.code,
        name: branches.name,
        isActive: branches.isActive,
        managerId: branches.managerId,
      })
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      return errorResponse(res, "Branch not found", 404, "BRANCH_NOT_FOUND");
    }

    // Attach branch context to request
    req.branch = {
      branchId: branch.id,
      branchCode: branch.code,
      branchName: branch.name,
      isActive: branch.isActive,
      managerId: branch.managerId,
    } as BranchContext;

    next();
  } catch (error: any) {
    next(error);
  }
}

/**
 * Middleware to ensure user has access to the branch
 * ShopOwner and TenantAdmin have access to all branches
 * Other roles must be assigned to the branch
 */
export async function authorizeBranchAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
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

    if (!req.branch) {
      return errorResponse(
        res,
        "Branch context required",
        400,
        "BRANCH_CONTEXT_MISSING",
      );
    }

    // ShopOwner and TenantAdmin have access to all branches
    if (req.user.role === "ShopOwner" || req.user.role === "TenantAdmin") {
      return next();
    }

    const db = getTenantDb(req.tenant.tenantId);

    // Check if user is assigned to this branch
    const [assignment] = await db
      .select()
      .from(staffAssignments)
      .where(
        eq(staffAssignments.userId, req.user.userId) &&
          eq(staffAssignments.branchId, req.branch.branchId),
      )
      .limit(1);

    if (!assignment) {
      return errorResponse(
        res,
        "You do not have access to this branch",
        403,
        "BRANCH_ACCESS_DENIED",
      );
    }

    next();
  } catch (error: any) {
    next(error);
  }
}

/**
 * Middleware to ensure user has specific role at branch level
 * @param allowedRoles - Roles that are allowed to access the resource
 */
export function requireBranchRole(...allowedRoles: Role[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return errorResponse(
          res,
          "Authentication required",
          401,
          "UNAUTHORIZED",
        );
      }

      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      if (!req.branch) {
        return errorResponse(
          res,
          "Branch context required",
          400,
          "BRANCH_CONTEXT_MISSING",
        );
      }

      // ShopOwner and TenantAdmin bypass branch-level role checks
      if (req.user.role === "ShopOwner" || req.user.role === "TenantAdmin") {
        return next();
      }

      const db = getTenantDb(req.tenant.tenantId);

      // Get user's role at this branch
      const [assignment] = await db
        .select()
        .from(staffAssignments)
        .where(
          eq(staffAssignments.userId, req.user.userId) &&
            eq(staffAssignments.branchId, req.branch.branchId),
        )
        .limit(1);

      if (!assignment) {
        return errorResponse(
          res,
          "You are not assigned to this branch",
          403,
          "BRANCH_ACCESS_DENIED",
        );
      }

      // Use branch-specific role if set, otherwise use user's global role
      const effectiveRole = assignment.roleAtBranch || req.user.role;

      if (!allowedRoles.includes(effectiveRole)) {
        return errorResponse(
          res,
          "You do not have the required role at this branch",
          403,
          "INSUFFICIENT_BRANCH_PERMISSIONS",
        );
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user is the branch manager
 */
export async function requireBranchManager(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return errorResponse(res, "Authentication required", 401, "UNAUTHORIZED");
    }

    if (!req.branch) {
      return errorResponse(
        res,
        "Branch context required",
        400,
        "BRANCH_CONTEXT_MISSING",
      );
    }

    // ShopOwner and TenantAdmin can act as branch managers
    if (req.user.role === "ShopOwner" || req.user.role === "TenantAdmin") {
      return next();
    }

    // Check if user is the assigned branch manager
    if (req.branch.managerId === req.user.userId) {
      return next();
    }

    return errorResponse(
      res,
      "Only the branch manager can perform this action",
      403,
      "MANAGER_REQUIRED",
    );
  } catch (error: any) {
    next(error);
  }
}
