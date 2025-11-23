import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { BranchesService } from "./branches.service";
import {
  assignStaffSchema,
  createBranchSchema,
  toggleInheritanceSchema,
  transferStaffSchema,
  updateBranchSchema,
} from "./branches.validation";

export class BranchesController {
  private branchesService: BranchesService;

  constructor() {
    this.branchesService = new BranchesService();
  }

  getAllBranches = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const branches = await this.branchesService.getAllBranches(
        req.tenant.tenantId,
      );
      return successResponse(res, branches);
    } catch (error: any) {
      next(error);
    }
  };

  getBranchById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const branch = await this.branchesService.getBranchById(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, branch);
    } catch (error: any) {
      next(error);
    }
  };

  createBranch = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const dto = createBranchSchema.parse(req.body);
      const branch = await this.branchesService.createBranch(
        req.tenant.tenantId,
        dto,
      );
      return successResponse(res, branch, 201);
    } catch (error: any) {
      next(error);
    }
  };

  updateBranch = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const dto = updateBranchSchema.parse(req.body);
      const branch = await this.branchesService.updateBranch(
        req.tenant.tenantId,
        id,
        dto,
      );
      return successResponse(res, branch);
    } catch (error: any) {
      next(error);
    }
  };

  deleteBranch = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const result = await this.branchesService.deleteBranch(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  getEffectiveSettings = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const settings =
        await this.branchesService.getEffectiveBranchSettings(
          req.tenant.tenantId,
          id,
        );
      return successResponse(res, settings);
    } catch (error: any) {
      next(error);
    }
  };

  toggleInheritance = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const dto = toggleInheritanceSchema.parse(req.body);
      const branch = await this.branchesService.toggleInheritance(
        req.tenant.tenantId,
        id,
        dto,
      );
      return successResponse(res, branch);
    } catch (error: any) {
      next(error);
    }
  };

  // Staff Management Methods

  getBranchStaff = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const staff = await this.branchesService.getBranchStaff(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, staff);
    } catch (error: any) {
      next(error);
    }
  };

  assignStaffToBranch = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      if (!req.user) {
        return errorResponse(
          res,
          "Authentication required",
          401,
          "UNAUTHORIZED",
        );
      }

      const { id } = req.params;
      const dto = assignStaffSchema.parse(req.body);
      const assignment = await this.branchesService.assignStaffToBranch(
        req.tenant.tenantId,
        id,
        dto.userId,
        dto.roleAtBranch || null,
        req.user.userId,
      );
      return successResponse(res, assignment, 201);
    } catch (error: any) {
      next(error);
    }
  };

  removeStaffFromBranch = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id, userId } = req.params;
      const result = await this.branchesService.removeStaffFromBranch(
        req.tenant.tenantId,
        id,
        userId,
      );
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  transferStaff = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      if (!req.user) {
        return errorResponse(
          res,
          "Authentication required",
          401,
          "UNAUTHORIZED",
        );
      }

      const dto = transferStaffSchema.parse(req.body);
      const result = await this.branchesService.transferStaffBetweenBranches(
        req.tenant.tenantId,
        dto.userId,
        dto.fromBranchId,
        dto.toBranchId,
        dto.roleAtNewBranch || null,
        req.user.userId,
      );
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };
}
