import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { InventoryLossesController } from "./inventory-losses.controller";

const router = Router();

const lossesController = new InventoryLossesController();

// ============================================
// INVENTORY LOSSES ROUTES
// ============================================

/**
 * @swagger
 * /api/inventory-losses:
 *   post:
 *     tags: [Inventory Losses]
 *     summary: Create a new inventory loss (draft status)
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
 *               - lossType
 *               - reason
 *               - items
 *             properties:
 *               branchId:
 *                 type: string
 *               lossType:
 *                 type: string
 *                 enum: [theft, breakage, expired, shrinkage, other]
 *               reason:
 *                 type: string
 *               referenceNumber:
 *                 type: string
 *               lossDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               expenseCategoryId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Loss created
 */
router.post("/", authenticate, lossesController.createLoss);

/**
 * @swagger
 * /api/inventory-losses/{lossId}:
 *   get:
 *     tags: [Inventory Losses]
 *     summary: Get loss by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lossId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loss details
 */
router.get("/:lossId", authenticate, lossesController.getLossById);

/**
 * @swagger
 * /api/inventory-losses/{lossId}:
 *   put:
 *     tags: [Inventory Losses]
 *     summary: Update an inventory loss (draft only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lossId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loss updated
 */
router.put("/:lossId", authenticate, lossesController.updateLoss);

/**
 * @swagger
 * /api/inventory-losses/{lossId}:
 *   delete:
 *     tags: [Inventory Losses]
 *     summary: Delete an inventory loss (draft only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lossId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loss deleted
 */
router.delete("/:lossId", authenticate, lossesController.deleteLoss);

/**
 * @swagger
 * /api/inventory-losses/{lossId}/approve:
 *   post:
 *     tags: [Inventory Losses]
 *     summary: Approve an inventory loss and deduct stock
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lossId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loss approved and stock deducted
 */
router.post("/:lossId/approve", authenticate, lossesController.approveLoss);

/**
 * @swagger
 * /api/inventory-losses/list:
 *   get:
 *     tags: [Inventory Losses]
 *     summary: Get inventory losses with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: lossType
 *         schema:
 *           type: string
 *           enum: [theft, breakage, expired, shrinkage, other]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, approved]
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
 *         name: minValue
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxValue
 *         schema:
 *           type: number
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
 *         description: List of losses
 */
router.get("/list", authenticate, lossesController.getLosses);

/**
 * @swagger
 * /api/inventory-losses/branches/{branchId}/report:
 *   get:
 *     tags: [Inventory Losses]
 *     summary: Get loss report for a branch
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
 *         description: Loss report with breakdowns
 */
router.get(
  "/branches/:branchId/report",
  authenticate,
  lossesController.getLossReport,
);

export default router;
