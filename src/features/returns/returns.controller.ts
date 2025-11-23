import { Request, Response } from "express";
import { ReturnsService } from "./returns.service";

const returnsService = new ReturnsService();

export class ReturnsController {
  /**
   * Create a new return
   */
  async createReturn(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const createdBy = req.userId!;

      const returnRecord = await returnsService.createReturn(
        tenantId,
        req.body,
        createdBy,
      );

      res.status(201).json(returnRecord);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to create return",
      });
    }
  }

  /**
   * Update a return
   */
  async updateReturn(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { returnId } = req.params;

      const returnRecord = await returnsService.updateReturn(
        tenantId,
        returnId,
        req.body,
      );

      res.json(returnRecord);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to update return",
      });
    }
  }

  /**
   * Delete a return
   */
  async deleteReturn(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { returnId } = req.params;

      const returnRecord = await returnsService.deleteReturn(tenantId, returnId);

      res.json(returnRecord);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to delete return",
      });
    }
  }

  /**
   * Approve a return
   */
  async approveReturn(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { returnId } = req.params;
      const approvedBy = req.userId!;

      const returnRecord = await returnsService.approveReturn(
        tenantId,
        returnId,
        approvedBy,
      );

      res.json(returnRecord);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to approve return",
      });
    }
  }

  /**
   * Process a return (stock handling)
   */
  async processReturn(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { returnId } = req.params;
      const processedBy = req.userId!;

      const returnRecord = await returnsService.processReturn(
        tenantId,
        returnId,
        processedBy,
      );

      res.json(returnRecord);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to process return",
      });
    }
  }

  /**
   * Add refund to return
   */
  async addRefund(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { returnId } = req.params;
      const createdBy = req.userId!;

      const refund = await returnsService.addRefund(
        tenantId,
        returnId,
        req.body,
        createdBy,
      );

      res.status(201).json(refund);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to add refund",
      });
    }
  }

  /**
   * Get return by ID
   */
  async getReturnById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { returnId } = req.params;

      const returnRecord = await returnsService.getReturnById(tenantId, returnId);

      res.json(returnRecord);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "Return not found",
      });
    }
  }

  /**
   * Get returns with filters
   */
  async getReturns(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const filters = {
        branchId: req.query.branchId as string | undefined,
        status: req.query.status as
          | "draft"
          | "approved"
          | "processed"
          | undefined,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      };

      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : 0;

      const returnRecords = await returnsService.getReturns(
        tenantId,
        filters,
        limit,
        offset,
      );

      res.json(returnRecords);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get returns",
      });
    }
  }

  /**
   * Get return report
   */
  async getReturnReport(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Start of current month

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(); // Today

      const report = await returnsService.getReturnReport(
        tenantId,
        branchId,
        startDate,
        endDate,
      );

      res.json(report);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get return report",
      });
    }
  }
}
