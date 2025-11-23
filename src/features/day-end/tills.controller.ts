import { Request, Response } from "express";
import { TillsService } from "./tills.service";

const tillsService = new TillsService();

export class TillsController {
  /**
   * Create a new till
   */
  async createTill(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const till = await tillsService.createTill(tenantId, req.body);
      res.status(201).json(till);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to create till",
      });
    }
  }

  /**
   * Update a till
   */
  async updateTill(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { tillId } = req.params;
      const till = await tillsService.updateTill(tenantId, tillId, req.body);
      res.json(till);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to update till",
      });
    }
  }

  /**
   * Register device to a till
   */
  async registerDevice(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { tillId } = req.params;
      const till = await tillsService.registerDevice(
        tenantId,
        tillId,
        req.body,
      );
      res.json(till);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to register device",
      });
    }
  }

  /**
   * Unregister device from a till
   */
  async unregisterDevice(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { tillId } = req.params;
      const till = await tillsService.unregisterDevice(tenantId, tillId);
      res.json(till);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to unregister device",
      });
    }
  }

  /**
   * Get till by ID
   */
  async getTillById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { tillId } = req.params;
      const till = await tillsService.getTillById(tenantId, tillId);
      res.json(till);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "Till not found",
      });
    }
  }

  /**
   * Get till by device ID
   */
  async getTillByDeviceId(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { deviceId } = req.params;
      const till = await tillsService.getTillByDeviceId(tenantId, deviceId);

      if (!till) {
        return res.status(404).json({ error: "Till not found for this device" });
      }

      res.json(till);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to get till",
      });
    }
  }

  /**
   * Get tills by branch
   */
  async getTillsByBranch(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;
      const tills = await tillsService.getTillsByBranch(tenantId, branchId);
      res.json(tills);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to get tills",
      });
    }
  }

  /**
   * Get active tills by branch
   */
  async getActiveTillsByBranch(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;
      const tills = await tillsService.getActiveTillsByBranch(
        tenantId,
        branchId,
      );
      res.json(tills);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to get tills",
      });
    }
  }

  /**
   * Delete till (soft delete)
   */
  async deleteTill(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { tillId } = req.params;
      const till = await tillsService.deleteTill(tenantId, tillId);
      res.json(till);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to delete till",
      });
    }
  }
}
