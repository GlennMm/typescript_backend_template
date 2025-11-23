import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { TaxesService } from "./taxes.service";

export class TaxesController {
  private service: TaxesService;

  constructor() {
    this.service = new TaxesService();
  }

  getAllTaxes = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const taxes = await this.service.getAllTaxes(tenantId);
      return successResponse(res, taxes);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getTaxById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const tax = await this.service.getTaxById(tenantId, id);
      return successResponse(res, tax);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  createTax = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const tax = await this.service.createTax(tenantId, req.body);
      return successResponse(res, tax, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateTax = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const tax = await this.service.updateTax(tenantId, id, req.body);
      return successResponse(res, tax);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  deleteTax = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      await this.service.deleteTax(tenantId, id);
      return successResponse(res, { message: "Tax deleted successfully" });
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  };

  assignTaxToProduct = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const assignment = await this.service.assignTaxToProduct(
        tenantId,
        req.body,
      );
      return successResponse(res, assignment, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  removeTaxFromProduct = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { productId, branchId, taxId } = req.params;
      await this.service.removeTaxFromProduct(
        tenantId,
        productId,
        branchId,
        taxId,
      );
      return successResponse(res, {
        message: "Tax removed from product successfully",
      });
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  };

  getProductBranchTaxes = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { productId, branchId } = req.params;
      const taxes = await this.service.getProductBranchTaxes(
        tenantId,
        productId,
        branchId,
      );
      return successResponse(res, taxes);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
