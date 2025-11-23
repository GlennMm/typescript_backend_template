import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { ReturnsController } from "./returns.controller";

const router = Router();

const returnsController = new ReturnsController();

// ============================================
// RETURNS ROUTES
// ============================================

/**
 * @swagger
 * /api/returns:
 *   post:
 *     tags: [Returns]
 *     summary: Create a new return (draft status)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchId
 *               - reason
 *               - items
 *             properties:
 *               branchId:
 *                 type: string
 *               saleId:
 *                 type: string
 *               laybyId:
 *                 type: string
 *               quotationId:
 *                 type: string
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *               returnDate:
 *                 type: string
 *                 format: date-time
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - condition
 *                   properties:
 *                     saleItemId:
 *                       type: string
 *                     laybyItemId:
 *                       type: string
 *                     quotationItemId:
 *                       type: string
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     condition:
 *                       type: string
 *                       enum: [good, damaged]
 *                     conditionNotes:
 *                       type: string
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Return created
 */
router.post("/", authenticate, returnsController.createReturn);

/**
 * @swagger
 * /api/returns/{returnId}:
 *   get:
 *     tags: [Returns]
 *     summary: Get return by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Return details
 */
router.get("/:returnId", authenticate, returnsController.getReturnById);

/**
 * @swagger
 * /api/returns/{returnId}:
 *   put:
 *     tags: [Returns]
 *     summary: Update a return (draft only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Return updated
 */
router.put("/:returnId", authenticate, returnsController.updateReturn);

/**
 * @swagger
 * /api/returns/{returnId}:
 *   delete:
 *     tags: [Returns]
 *     summary: Delete a return (draft only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Return deleted
 */
router.delete("/:returnId", authenticate, returnsController.deleteReturn);

/**
 * @swagger
 * /api/returns/{returnId}/approve:
 *   post:
 *     tags: [Returns]
 *     summary: Approve a return (Manager/Supervisor required)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Return approved
 */
router.post(
  "/:returnId/approve",
  authenticate,
  returnsController.approveReturn,
);

/**
 * @swagger
 * /api/returns/{returnId}/process:
 *   post:
 *     tags: [Returns]
 *     summary: Process a return (handle stock - good items back to inventory, damaged items to losses)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Return processed
 */
router.post(
  "/:returnId/process",
  authenticate,
  returnsController.processReturn,
);

/**
 * @swagger
 * /api/returns/{returnId}/refunds:
 *   post:
 *     tags: [Returns]
 *     summary: Add refund to return (supports partial refunds)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currencyId
 *               - paymentMethodId
 *             properties:
 *               amount:
 *                 type: number
 *               currencyId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *               shiftId:
 *                 type: string
 *               referenceNumber:
 *                 type: string
 *               refundDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Refund added
 */
router.post("/:returnId/refunds", authenticate, returnsController.addRefund);

/**
 * @swagger
 * /api/returns/list:
 *   get:
 *     tags: [Returns]
 *     summary: Get returns with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, approved, processed]
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of returns
 */
router.get("/list", authenticate, returnsController.getReturns);

/**
 * @swagger
 * /api/returns/branches/{branchId}/report:
 *   get:
 *     tags: [Returns]
 *     summary: Get return report for a branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
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
 *     responses:
 *       200:
 *         description: Return report with breakdowns
 */
router.get(
  "/branches/:branchId/report",
  authenticate,
  returnsController.getReturnReport,
);

export default router;
