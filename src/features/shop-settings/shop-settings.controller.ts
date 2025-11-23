import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { ShopSettingsService } from "./shop-settings.service";
import {
  createShopSettingsSchema,
  updateShopSettingsSchema,
} from "./shop-settings.validation";

export class ShopSettingsController {
  private shopSettingsService: ShopSettingsService;

  constructor() {
    this.shopSettingsService = new ShopSettingsService();
  }

  getShopSettings = async (
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

      const settings = await this.shopSettingsService.getShopSettings(
        req.tenant.tenantId,
      );
      return successResponse(res, settings);
    } catch (error: any) {
      next(error);
    }
  };

  createShopSettings = async (
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

      const dto = createShopSettingsSchema.parse(req.body);
      const settings = await this.shopSettingsService.createShopSettings(
        req.tenant.tenantId,
        dto,
      );
      return successResponse(res, settings, 201);
    } catch (error: any) {
      next(error);
    }
  };

  updateShopSettings = async (
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

      const dto = updateShopSettingsSchema.parse(req.body);
      const settings = await this.shopSettingsService.updateShopSettings(
        req.tenant.tenantId,
        dto,
      );
      return successResponse(res, settings);
    } catch (error: any) {
      next(error);
    }
  };
}
