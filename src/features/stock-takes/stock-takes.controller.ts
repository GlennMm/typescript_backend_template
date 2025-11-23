import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { StockTakesService } from "./stock-takes.service";

export class StockTakesController {
  private service: StockTakesService;

  constructor() {
    this.service = new StockTakesService();
  }

  createStockTake = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user?.userId!;
      const stockTake = await this.service.createStockTake(
        tenantId,
        req.body,
        userId,
      );
      return successResponse(res, stockTake, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getAllStockTakes = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.query;
      const stockTakes = await this.service.getAllStockTakes(
        tenantId,
        branchId as string | undefined,
      );
      return successResponse(res, stockTakes);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getStockTakeById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const stockTake = await this.service.getStockTakeById(tenantId, id);
      return successResponse(res, stockTake);
    } catch (error: any) {
      return errorResponse(res, error.message, 404);
    }
  };

  startStockTake = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const stockTake = await this.service.startStockTake(tenantId, id, userId);
      return successResponse(res, stockTake);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateStockTakeItem = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id, itemId } = req.params;
      const item = await this.service.updateStockTakeItem(
        tenantId,
        id,
        itemId,
        req.body,
        userId,
      );
      return successResponse(res, item);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  completeCount = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const stockTake = await this.service.completeCount(tenantId, id, userId);
      return successResponse(res, stockTake);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  approveStockTake = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const stockTake = await this.service.approveStockTake(
        tenantId,
        id,
        req.body,
        userId,
      );
      return successResponse(res, stockTake);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  rejectStockTake = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const stockTake = await this.service.rejectStockTake(
        tenantId,
        id,
        req.body,
        userId,
      );
      return successResponse(res, stockTake);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  recountStockTake = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const userId = req.user!.userId;
      const { id } = req.params;
      const stockTake = await this.service.recountStockTake(
        tenantId,
        id,
        userId,
      );
      return successResponse(res, stockTake);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getActiveStockTake = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.params;
      const stockTake = await this.service.getActiveStockTake(
        tenantId,
        branchId,
      );
      return successResponse(res, stockTake);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
