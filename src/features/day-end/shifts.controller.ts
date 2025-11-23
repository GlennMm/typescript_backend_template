import { Request, Response } from "express";
import { ShiftsService } from "./shifts.service";

const shiftsService = new ShiftsService();

export class ShiftsController {
  /**
   * Open a new shift
   */
  async openShift(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const cashierId = req.userId!;
      const shift = await shiftsService.openShift(tenantId, cashierId, req.body);
      res.status(201).json(shift);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to open shift",
      });
    }
  }

  /**
   * Get current shift for logged-in cashier
   */
  async getCurrentShift(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const cashierId = req.userId!;
      const shift = await shiftsService.getCurrentShift(tenantId, cashierId);

      if (!shift) {
        return res.status(404).json({ error: "No open shift found" });
      }

      res.json(shift);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get current shift",
      });
    }
  }

  /**
   * Add cash movement to shift
   */
  async addCashMovement(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { shiftId } = req.params;
      const createdBy = req.userId!;

      const movement = await shiftsService.addCashMovement(
        tenantId,
        shiftId,
        req.body,
        createdBy,
      );

      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to add cash movement",
      });
    }
  }

  /**
   * Approve cash movement (Manager/Supervisor only)
   */
  async approveCashMovement(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { movementId } = req.params;
      const approvedBy = req.userId!;

      const movement = await shiftsService.approveCashMovement(
        tenantId,
        movementId,
        approvedBy,
      );

      res.json(movement);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to approve cash movement",
      });
    }
  }

  /**
   * Get cash movements for a shift
   */
  async getCashMovementsByShift(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { shiftId } = req.params;

      const movements = await shiftsService.getCashMovementsByShift(
        tenantId,
        shiftId,
      );

      res.json(movements);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get cash movements",
      });
    }
  }

  /**
   * Get pending cash movements for a shift
   */
  async getPendingCashMovements(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { shiftId } = req.params;

      const movements = await shiftsService.getPendingCashMovements(
        tenantId,
        shiftId,
      );

      res.json(movements);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get pending cash movements",
      });
    }
  }

  /**
   * Close shift
   */
  async closeShift(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { shiftId } = req.params;

      const shift = await shiftsService.closeShift(
        tenantId,
        shiftId,
        req.body,
      );

      res.json(shift);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to close shift",
      });
    }
  }

  /**
   * Get shift by ID
   */
  async getShiftById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { shiftId } = req.params;

      const shift = await shiftsService.getShiftById(tenantId, shiftId);

      res.json(shift);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "Shift not found",
      });
    }
  }

  /**
   * Get shifts by branch
   */
  async getShiftsByBranch(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;

      const shifts = await shiftsService.getShiftsByBranch(
        tenantId,
        branchId,
        limit,
      );

      res.json(shifts);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to get shifts",
      });
    }
  }

  /**
   * Get shifts by cashier
   */
  async getShiftsByCashier(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { cashierId } = req.params;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;

      const shifts = await shiftsService.getShiftsByCashier(
        tenantId,
        cashierId,
        limit,
      );

      res.json(shifts);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to get shifts",
      });
    }
  }
}
