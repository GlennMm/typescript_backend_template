import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { BranchesService } from "./branches.service";
import {
  createBranchSchema,
  toggleInheritanceSchema,
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
}
