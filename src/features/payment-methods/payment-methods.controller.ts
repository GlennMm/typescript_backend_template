import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { PaymentMethodsService } from "./payment-methods.service";

export class PaymentMethodsController {
  private service: PaymentMethodsService;

  constructor() {
    this.service = new PaymentMethodsService();
  }

  // Tenant-wide Payment Methods

  getAllPaymentMethods = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const methods = await this.service.getAllPaymentMethods(tenantId);
      return successResponse(res, methods);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getPaymentMethodById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const method = await this.service.getPaymentMethodById(tenantId, id);
      return successResponse(res, method);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  createPaymentMethod = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const method = await this.service.createPaymentMethod(
        tenantId,
        req.body,
      );
      return successResponse(res, method, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updatePaymentMethod = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const method = await this.service.updatePaymentMethod(
        tenantId,
        id,
        req.body,
      );
      return successResponse(res, method);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  deletePaymentMethod = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      await this.service.deletePaymentMethod(tenantId, id);
      return successResponse(res, {
        message: "Payment method deleted successfully",
      });
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  };

  // Branch Payment Methods

  getBranchPaymentMethods = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.params;
      const methods = await this.service.getBranchPaymentMethods(
        tenantId,
        branchId,
      );
      return successResponse(res, methods);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  createBranchPaymentMethod = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.params;
      const method = await this.service.createBranchPaymentMethod(tenantId, {
        ...req.body,
        branchId,
      });
      return successResponse(res, method, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateBranchPaymentMethod = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const method = await this.service.updateBranchPaymentMethod(
        tenantId,
        id,
        req.body,
      );
      return successResponse(res, method);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  deleteBranchPaymentMethod = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      await this.service.deleteBranchPaymentMethod(tenantId, id);
      return successResponse(res, {
        message: "Branch payment method deleted successfully",
      });
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  };
}
