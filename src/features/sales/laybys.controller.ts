import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { LaybysService } from "./laybys.service";

export class LaybysController {
  private service: LaybysService;

  constructor() {
    this.service = new LaybysService();
  }

  createLayby = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const layby = await this.service.createLayby(tenantId, req.body, userId);
      return successResponse(res, layby, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getAllLaybys = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId, customerId, status, startDate, endDate } = req.query;
      const laybys = await this.service.getAllLaybys(tenantId, {
        branchId: branchId as string,
        customerId: customerId as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      return successResponse(res, laybys);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getLaybyById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const layby = await this.service.getLaybyById(tenantId, id);
      return successResponse(res, layby);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateLayby = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const layby = await this.service.updateLayby(tenantId, id, req.body);
      return successResponse(res, layby);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  activateLayby = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const layby = await this.service.activateLayby(tenantId, id);
      return successResponse(res, layby);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  addPayment = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const layby = await this.service.addPayment(tenantId, id, req.body, userId);
      return successResponse(res, layby);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  collectLayby = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const layby = await this.service.collectLayby(tenantId, id, userId);
      return successResponse(res, layby);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  cancelLayby = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const result = await this.service.cancelLayby(tenantId, id, req.body, userId);
      return successResponse(res, result);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getActiveLaybys = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.query;
      const laybys = await this.service.getActiveLaybys(tenantId, branchId as string);
      return successResponse(res, laybys);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
