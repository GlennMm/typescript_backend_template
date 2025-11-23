import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { CurrenciesService } from "./currencies.service";

export class CurrenciesController {
  private service: CurrenciesService;

  constructor() {
    this.service = new CurrenciesService();
  }

  getAllCurrencies = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const currencies = await this.service.getAllCurrencies(tenantId);
      return successResponse(res, currencies);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getCurrencyById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const currency = await this.service.getCurrencyById(tenantId, id);
      return successResponse(res, currency);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  createCurrency = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const currency = await this.service.createCurrency(tenantId, req.body);
      return successResponse(res, currency, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateCurrency = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const currency = await this.service.updateCurrency(
        tenantId,
        id,
        req.body,
      );
      return successResponse(res, currency);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  deleteCurrency = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      await this.service.deleteCurrency(tenantId, id);
      return successResponse(res, {
        message: "Currency deleted successfully",
      });
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  };

  setDefaultCurrency = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const currency = await this.service.setDefaultCurrency(tenantId, id);
      return successResponse(res, currency);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };
}
