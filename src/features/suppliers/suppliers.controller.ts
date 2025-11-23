import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/responses";
import { SuppliersService } from "./suppliers.service";

export class SuppliersController {
  private service: SuppliersService;

  constructor() {
    this.service = new SuppliersService();
  }

  getAllSuppliers = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const search = req.query.search as string | undefined;
      const suppliers = await this.service.getAllSuppliers(tenantId, search);
      return successResponse(res, suppliers);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getSupplierById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const supplier = await this.service.getSupplierById(tenantId, id);
      return successResponse(res, supplier);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  createSupplier = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const supplier = await this.service.createSupplier(tenantId, req.body);
      return successResponse(res, supplier, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateSupplier = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const supplier = await this.service.updateSupplier(
        tenantId,
        id,
        req.body,
      );
      return successResponse(res, supplier);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  deleteSupplier = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      await this.service.deleteSupplier(tenantId, id);
      return successResponse(res, {
        message: "Supplier deleted successfully",
      });
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  };
}
