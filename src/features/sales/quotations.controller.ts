import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { QuotationsService } from "./quotations.service";

export class QuotationsController {
  private service: QuotationsService;

  constructor() {
    this.service = new QuotationsService();
  }

  createQuotation = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const quotation = await this.service.createQuotation(tenantId, req.body, userId);
      return successResponse(res, quotation, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getAllQuotations = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId, customerId, status, startDate, endDate } = req.query;
      const quotations = await this.service.getAllQuotations(tenantId, {
        branchId: branchId as string,
        customerId: customerId as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      return successResponse(res, quotations);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getQuotationById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const quotation = await this.service.getQuotationById(tenantId, id);
      return successResponse(res, quotation);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateQuotation = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const quotation = await this.service.updateQuotation(tenantId, id, req.body);
      return successResponse(res, quotation);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  sendQuotation = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const quotation = await this.service.sendQuotation(tenantId, id, userId);
      return successResponse(res, quotation);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  convertToSale = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const sale = await this.service.convertToSale(tenantId, id, userId);
      return successResponse(res, sale);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  rejectQuotation = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const { reason } = req.body;
      const quotation = await this.service.rejectQuotation(tenantId, id, reason);
      return successResponse(res, quotation);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  recreateQuotation = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const quotation = await this.service.recreateQuotation(tenantId, id, userId);
      return successResponse(res, quotation, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
