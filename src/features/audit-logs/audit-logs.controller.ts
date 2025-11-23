import { Request, Response } from "express";
import { AuditLogsService } from "./audit-logs.service";

const auditLogsService = new AuditLogsService();

export class AuditLogsController {
  /**
   * Get audit logs with filters
   */
  async getAuditLogs(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const filters = {
        tableName: req.query.tableName as string | undefined,
        recordId: req.query.recordId as string | undefined,
        action: req.query.action as "INSERT" | "UPDATE" | "DELETE" | undefined,
        userId: req.query.userId as string | undefined,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        includeArchived: req.query.includeArchived === "true",
      };

      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 100;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : 0;

      const logs = await auditLogsService.getAuditLogs(
        tenantId,
        filters,
        limit,
        offset,
      );

      res.json(logs);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to get logs",
      });
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { logId } = req.params;

      const log = await auditLogsService.getAuditLogById(tenantId, logId);

      res.json(log);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "Log not found",
      });
    }
  }

  /**
   * Get audit history for a specific record
   */
  async getRecordHistory(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { tableName, recordId } = req.params;

      const logs = await auditLogsService.getRecordHistory(
        tenantId,
        tableName,
        recordId,
      );

      res.json(logs);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get history",
      });
    }
  }

  /**
   * Archive old logs
   */
  async archiveLogs(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { beforeDate } = req.body;

      if (!beforeDate) {
        return res.status(400).json({ error: "beforeDate is required" });
      }

      const result = await auditLogsService.archiveLogs(
        tenantId,
        new Date(beforeDate),
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to archive logs",
      });
    }
  }

  /**
   * Unarchive logs
   */
  async unarchiveLogs(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { logIds } = req.body;

      if (!logIds || !Array.isArray(logIds)) {
        return res.status(400).json({ error: "logIds array is required" });
      }

      const result = await auditLogsService.unarchiveLogs(tenantId, logIds);

      res.json(result);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to unarchive logs",
      });
    }
  }

  /**
   * Export audit logs
   */
  async exportLogs(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const filters = {
        tableName: req.query.tableName as string | undefined,
        recordId: req.query.recordId as string | undefined,
        action: req.query.action as "INSERT" | "UPDATE" | "DELETE" | undefined,
        userId: req.query.userId as string | undefined,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        includeArchived: req.query.includeArchived === "true",
      };

      const logs = await auditLogsService.exportLogs(tenantId, filters);

      // Set headers for CSV download
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-logs-${Date.now()}.json`,
      );

      res.json(logs);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to export logs",
      });
    }
  }

  /**
   * Get audit summary statistics
   */
  async getAuditSummary(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const summary = await auditLogsService.getAuditSummary(
        tenantId,
        startDate,
        endDate,
      );

      res.json(summary);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get summary",
      });
    }
  }
}
