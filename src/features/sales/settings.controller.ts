import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { SettingsService } from "./settings.service";

export class SettingsController {
  private service: SettingsService;

  constructor() {
    this.service = new SettingsService();
  }

  getTenantSettings = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const settings = await this.service.getTenantSettings(tenantId);
      return successResponse(res, settings);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateTenantSettings = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const settings = await this.service.updateTenantSettings(tenantId, req.body);
      return successResponse(res, settings);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getBranchSettings = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.params;
      const settings = await this.service.getBranchSettings(tenantId, branchId);
      return successResponse(res, settings);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateBranchSettings = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.params;
      const settings = await this.service.updateBranchSettings(tenantId, branchId, req.body);
      return successResponse(res, settings);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getBranchDiscounts = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.params;
      const discounts = await this.service.getBranchDiscounts(tenantId, branchId);
      return successResponse(res, discounts);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  createDiscount = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const discount = await this.service.createDiscount(tenantId, req.body);
      return successResponse(res, discount, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateDiscount = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const discount = await this.service.updateDiscount(tenantId, id, req.body);
      return successResponse(res, discount);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  deleteDiscount = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const discount = await this.service.deleteDiscount(tenantId, id);
      return successResponse(res, discount);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
