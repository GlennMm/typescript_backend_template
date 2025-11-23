import { Request, Response } from "express";
import { DayEndService } from "./day-end.service";

const dayEndService = new DayEndService();

export class DayEndController {
  /**
   * Get day end by ID with full summary
   */
  async getDayEndById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { dayEndId } = req.params;

      const summary = await dayEndService.getDayEndById(tenantId, dayEndId);

      res.json(summary);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "Day end not found",
      });
    }
  }

  /**
   * Get day ends by branch
   */
  async getDayEndsByBranch(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const dayEnds = await dayEndService.getDayEndsByBranch(
        tenantId,
        branchId,
        startDate,
        endDate,
      );

      res.json(dayEnds);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to get day ends",
      });
    }
  }

  /**
   * Update payment reconciliation
   */
  async updatePaymentReconciliation(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { dayEndId } = req.params;

      await dayEndService.updatePaymentReconciliation(
        tenantId,
        dayEndId,
        req.body.reconciliations,
      );

      res.json({ message: "Payment reconciliation updated" });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update payment reconciliation",
      });
    }
  }

  /**
   * Review day end
   */
  async reviewDayEnd(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { dayEndId } = req.params;
      const reviewedBy = req.userId!;

      const dayEnd = await dayEndService.reviewDayEnd(
        tenantId,
        dayEndId,
        reviewedBy,
      );

      res.json(dayEnd);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to review day end",
      });
    }
  }

  /**
   * Approve day end
   */
  async approveDayEnd(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { dayEndId } = req.params;
      const approvedBy = req.userId!;

      const dayEnd = await dayEndService.approveDayEnd(
        tenantId,
        dayEndId,
        approvedBy,
      );

      res.json(dayEnd);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to approve day end",
      });
    }
  }

  /**
   * Reopen day end
   */
  async reopenDayEnd(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { dayEndId } = req.params;
      const reopenedBy = req.userId!;

      const dayEnd = await dayEndService.reopenDayEnd(
        tenantId,
        dayEndId,
        reopenedBy,
      );

      res.json(dayEnd);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to reopen day end",
      });
    }
  }
}
