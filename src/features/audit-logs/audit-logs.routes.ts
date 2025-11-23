import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { AuditLogsController } from "./audit-logs.controller";

const router = Router();

const auditLogsController = new AuditLogsController();

// ============================================
// AUDIT LOGS ROUTES
// ============================================

/**
 * @swagger
 * /api/audit-logs/list:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get audit logs with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tableName
 *         schema:
 *           type: string
 *       - in: query
 *         name: recordId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [INSERT, UPDATE, DELETE]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: includeArchived
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of audit logs
 */
router.get("/list", authenticate, auditLogsController.getAuditLogs);

/**
 * @swagger
 * /api/audit-logs/{logId}:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get audit log by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log details
 */
router.get("/:logId", authenticate, auditLogsController.getAuditLogById);

/**
 * @swagger
 * /api/audit-logs/records/{tableName}/{recordId}/history:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get complete audit history for a specific record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit history for record
 */
router.get(
  "/records/:tableName/:recordId/history",
  authenticate,
  auditLogsController.getRecordHistory,
);

/**
 * @swagger
 * /api/audit-logs/archive:
 *   post:
 *     tags: [Audit Logs]
 *     summary: Archive logs older than specified date
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - beforeDate
 *             properties:
 *               beforeDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Logs archived successfully
 */
router.post("/archive", authenticate, auditLogsController.archiveLogs);

/**
 * @swagger
 * /api/audit-logs/unarchive:
 *   post:
 *     tags: [Audit Logs]
 *     summary: Unarchive specific logs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - logIds
 *             properties:
 *               logIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Logs unarchived successfully
 */
router.post("/unarchive", authenticate, auditLogsController.unarchiveLogs);

/**
 * @swagger
 * /api/audit-logs/export:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Export audit logs as JSON
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tableName
 *         schema:
 *           type: string
 *       - in: query
 *         name: recordId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [INSERT, UPDATE, DELETE]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: includeArchived
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Audit logs JSON export
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuditLog'
 */
router.get("/export", authenticate, auditLogsController.exportLogs);

/**
 * @swagger
 * /api/audit-logs/summary:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get audit summary statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Audit summary statistics
 */
router.get("/summary", authenticate, auditLogsController.getAuditSummary);

export default router;
