import { Request, Response } from "express";
import { InventoryLossesService } from "./inventory-losses.service";

const lossesService = new InventoryLossesService();

export class InventoryLossesController {
  /**
   * Create a new inventory loss
   */
  async createLoss(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const createdBy = req.userId!;

      const loss = await lossesService.createLoss(
        tenantId,
        req.body,
        createdBy,
      );

      res.status(201).json(loss);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to create loss",
      });
    }
  }

  /**
   * Update an inventory loss
   */
  async updateLoss(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { lossId } = req.params;

      const loss = await lossesService.updateLoss(tenantId, lossId, req.body);

      res.json(loss);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to update loss",
      });
    }
  }

  /**
   * Delete an inventory loss
   */
  async deleteLoss(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { lossId } = req.params;

      const loss = await lossesService.deleteLoss(tenantId, lossId);

      res.json(loss);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to delete loss",
      });
    }
  }

  /**
   * Approve an inventory loss
   */
  async approveLoss(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { lossId } = req.params;
      const approvedBy = req.userId!;

      const loss = await lossesService.approveLoss(
        tenantId,
        lossId,
        approvedBy,
      );

      res.json(loss);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to approve loss",
      });
    }
  }

  /**
   * Get inventory loss by ID
   */
  async getLossById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { lossId } = req.params;

      const loss = await lossesService.getLossById(tenantId, lossId);

      res.json(loss);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "Loss not found",
      });
    }
  }

  /**
   * Get inventory losses with filters
   */
  async getLosses(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const filters = {
        branchId: req.query.branchId as string | undefined,
        lossType: req.query.lossType as
          | "theft"
          | "breakage"
          | "expired"
          | "shrinkage"
          | "other"
          | undefined,
        status: req.query.status as "draft" | "approved" | undefined,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        minValue: req.query.minValue
          ? parseFloat(req.query.minValue as string)
          : undefined,
        maxValue: req.query.maxValue
          ? parseFloat(req.query.maxValue as string)
          : undefined,
      };

      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : 0;

      const losses = await lossesService.getLosses(
        tenantId,
        filters,
        limit,
        offset,
      );

      res.json(losses);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to get losses",
      });
    }
  }

  /**
   * Get loss report
   */
  async getLossReport(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Start of current month

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(); // Today

      const report = await lossesService.getLossReport(
        tenantId,
        branchId,
        startDate,
        endDate,
      );

      res.json(report);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get loss report",
      });
    }
  }
}
