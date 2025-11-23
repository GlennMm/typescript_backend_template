import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/responses";
import { PurchasesService } from "./purchases.service";

export class PurchasesController {
  private service: PurchasesService;

  constructor() {
    this.service = new PurchasesService();
  }

  createPurchase = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const purchase = await this.service.createPurchase(
        tenantId,
        req.body,
        userId,
      );
      return successResponse(res, purchase, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getAllPurchases = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { branchId, supplierId, status } = req.query;
      const purchases = await this.service.getAllPurchases(tenantId, {
        branchId: branchId as string | undefined,
        supplierId: supplierId as string | undefined,
        status: status as string | undefined,
      });
      return successResponse(res, purchases);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getPurchaseById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const purchase = await this.service.getPurchaseById(tenantId, id);
      return successResponse(res, purchase);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  updatePurchase = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const purchase = await this.service.updatePurchase(
        tenantId,
        id,
        req.body,
      );
      return successResponse(res, purchase);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  submitPurchase = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const purchase = await this.service.submitPurchase(tenantId, id);
      return successResponse(res, purchase);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  cancelPurchase = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      await this.service.cancelPurchase(tenantId, id);
      return successResponse(res, { message: "Purchase cancelled successfully" });
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  addPayment = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { id } = req.params;
      const payment = await this.service.addPayment(
        tenantId,
        id,
        req.body,
        userId,
      );
      return successResponse(res, payment, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  deletePayment = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { paymentId } = req.params;
      await this.service.deletePayment(tenantId, paymentId);
      return successResponse(res, { message: "Payment deleted successfully" });
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  receiveGoods = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { id } = req.params;
      await this.service.receiveGoods(tenantId, id, req.body, userId);
      return successResponse(res, { message: "Goods received successfully" });
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getProductPurchaseHistory = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { productId } = req.params;
      const history = await this.service.getProductPurchaseHistory(
        tenantId,
        productId,
      );
      return successResponse(res, history);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getUnpaidPurchases = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const purchases = await this.service.getUnpaidPurchases(tenantId);
      return successResponse(res, purchases);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
