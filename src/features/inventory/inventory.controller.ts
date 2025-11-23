import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { InventoryService } from "./inventory.service";
import {
  adjustInventorySchema,
  approveTransferSchema,
  createTransferSchema,
  setInventorySchema,
} from "./inventory.validation";

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  // Branch Inventory Methods

  getBranchInventory = async (
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

      const { branchId } = req.params;
      const inventory = await this.inventoryService.getBranchInventory(
        req.tenant.tenantId,
        branchId,
      );
      return successResponse(res, inventory);
    } catch (error: any) {
      next(error);
    }
  };

  getProductInventoryAtBranch = async (
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

      const { branchId, productId } = req.params;
      const inventory =
        await this.inventoryService.getProductInventoryAtBranch(
          req.tenant.tenantId,
          branchId,
          productId,
        );
      return successResponse(res, inventory);
    } catch (error: any) {
      next(error);
    }
  };

  adjustInventory = async (
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

      const { branchId } = req.params;
      const dto = adjustInventorySchema.parse(req.body);
      const inventory = await this.inventoryService.adjustInventory(
        req.tenant.tenantId,
        branchId,
        dto,
      );
      return successResponse(res, inventory);
    } catch (error: any) {
      next(error);
    }
  };

  setInventory = async (
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

      const { branchId } = req.params;
      const dto = setInventorySchema.parse(req.body);
      const inventory = await this.inventoryService.setInventory(
        req.tenant.tenantId,
        branchId,
        dto,
      );
      return successResponse(res, inventory);
    } catch (error: any) {
      next(error);
    }
  };

  getLowStockItems = async (
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

      const { branchId } = req.params;
      const lowStockItems = await this.inventoryService.getLowStockItems(
        req.tenant.tenantId,
        branchId,
      );
      return successResponse(res, lowStockItems);
    } catch (error: any) {
      next(error);
    }
  };

  // Transfer Methods

  getAllTransfers = async (
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

      const branchId = req.query.branchId as string | undefined;
      const transfers = await this.inventoryService.getAllTransfers(
        req.tenant.tenantId,
        branchId,
      );
      return successResponse(res, transfers);
    } catch (error: any) {
      next(error);
    }
  };

  getTransferById = async (
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
      const transfer = await this.inventoryService.getTransferById(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, transfer);
    } catch (error: any) {
      next(error);
    }
  };

  createTransfer = async (
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

      const dto = createTransferSchema.parse(req.body);
      const transfer = await this.inventoryService.createTransfer(
        req.tenant.tenantId,
        dto,
        req.user.userId,
      );
      return successResponse(res, transfer, 201);
    } catch (error: any) {
      next(error);
    }
  };

  approveTransfer = async (
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
      const dto = approveTransferSchema.parse(req.body);
      const transfer = await this.inventoryService.approveTransfer(
        req.tenant.tenantId,
        id,
        dto,
        req.user.userId,
      );
      return successResponse(res, transfer);
    } catch (error: any) {
      next(error);
    }
  };

  completeTransfer = async (
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
      const transfer = await this.inventoryService.completeTransfer(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, transfer);
    } catch (error: any) {
      next(error);
    }
  };
}
