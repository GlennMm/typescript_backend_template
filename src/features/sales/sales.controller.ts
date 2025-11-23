import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { SalesService } from "./sales.service";

export class SalesController {
  private service: SalesService;

  constructor() {
    this.service = new SalesService();
  }

  createCreditSale = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const sale = await this.service.createCreditSale(tenantId, req.body, userId);
      return successResponse(res, sale, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  createTillSale = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const sale = await this.service.createTillSale(tenantId, req.body, userId);
      return successResponse(res, sale, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getAllSales = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId, customerId, status, saleType, startDate, endDate } = req.query;
      const sales = await this.service.getAllSales(tenantId, {
        branchId: branchId as string,
        customerId: customerId as string,
        status: status as string,
        saleType: saleType as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      return successResponse(res, sales);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getSaleById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const sale = await this.service.getSaleById(tenantId, id);
      return successResponse(res, sale);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateSale = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const sale = await this.service.updateSale(tenantId, id, req.body);
      return successResponse(res, sale);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  confirmSale = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const sale = await this.service.confirmSale(tenantId, id, userId);
      return successResponse(res, sale);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  addPayment = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const sale = await this.service.addPayment(tenantId, id, req.body, userId);
      return successResponse(res, sale);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  cancelSale = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const result = await this.service.cancelSale(tenantId, id);
      return successResponse(res, result);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getUnpaidSales = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.query;
      const sales = await this.service.getUnpaidSales(tenantId, branchId as string);
      return successResponse(res, sales);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
