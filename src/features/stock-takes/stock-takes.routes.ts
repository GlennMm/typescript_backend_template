import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { StockTakesController } from "./stock-takes.controller";

const router = Router();
const stockTakesController = new StockTakesController();

// All stock-take routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

/**
 * @swagger
 * /api/stock-takes:
 *   post:
 *     tags: [Stock Takes]
 *     summary: Create new stock-take
 *     description: Initialize a stock-take for a branch (captures snapshot of all products)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchId
 *             properties:
 *               branchId:
 *                 type: string
 *                 example: branch_123
 *     responses:
 *       201:
 *         description: Stock-take created successfully
 *       400:
 *         description: Branch already has active stock-take
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.createStockTake,
);

/**
 * @swagger
 * /api/stock-takes:
 *   get:
 *     tags: [Stock Takes]
 *     summary: Get all stock-takes
 *     description: Retrieve all stock-takes (tenant-wide view with optional branch filter)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: branchId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by branch ID
 *     responses:
 *       200:
 *         description: List of stock-takes
 */
router.get(
  "/",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.getAllStockTakes,
);

/**
 * @swagger
 * /api/stock-takes/branch/{branchId}/active:
 *   get:
 *     tags: [Stock Takes]
 *     summary: Get active stock-take for branch
 *     description: Check if branch has an active stock-take (started or counted status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: branchId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active stock-take or null
 */
router.get(
  "/branch/:branchId/active",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.getActiveStockTake,
);

/**
 * @swagger
 * /api/stock-takes/{id}:
 *   get:
 *     tags: [Stock Takes]
 *     summary: Get stock-take by ID
 *     description: Retrieve stock-take details with all items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock-take details with items
 *       404:
 *         description: Stock-take not found
 */
router.get(
  "/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.getStockTakeById,
);

/**
 * @swagger
 * /api/stock-takes/{id}/start:
 *   patch:
 *     tags: [Stock Takes]
 *     summary: Start stock-take
 *     description: Start counting (initialized → started, blocks inventory adjustments)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock-take started
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Insufficient permissions
 */
router.patch(
  "/:id/start",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.startStockTake,
);

/**
 * @swagger
 * /api/stock-takes/{id}/items/{itemId}:
 *   put:
 *     tags: [Stock Takes]
 *     summary: Update item count
 *     description: Record actual quantity and notes for a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: itemId
 *         in: path
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
 *               - actualQuantity
 *             properties:
 *               actualQuantity:
 *                 type: number
 *                 example: 95
 *               notes:
 *                 type: string
 *                 example: 5 damaged units found
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       400:
 *         description: Stock-take not in correct status
 */
router.put(
  "/:id/items/:itemId",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.updateStockTakeItem,
);

/**
 * @swagger
 * /api/stock-takes/{id}/complete-count:
 *   patch:
 *     tags: [Stock Takes]
 *     summary: Complete counting
 *     description: Mark all items as counted (started → counted)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Counting completed
 *       400:
 *         description: Not all items counted or invalid status
 */
router.patch(
  "/:id/complete-count",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.completeCount,
);

/**
 * @swagger
 * /api/stock-takes/{id}/approve:
 *   patch:
 *     tags: [Stock Takes]
 *     summary: Approve stock-take
 *     description: Approve and apply adjustments (counted → approved, updates inventory)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock-take approved and inventory updated
 *       400:
 *         description: Invalid status for approval
 */
router.patch(
  "/:id/approve",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.approveStockTake,
);

/**
 * @swagger
 * /api/stock-takes/{id}/reject:
 *   patch:
 *     tags: [Stock Takes]
 *     summary: Reject stock-take
 *     description: Reject with notes (counted → rejected, allows recount)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
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
 *               - rejectionNotes
 *             properties:
 *               rejectionNotes:
 *                 type: string
 *                 example: Recount needed for Product X - count seems incorrect
 *     responses:
 *       200:
 *         description: Stock-take rejected
 *       400:
 *         description: Invalid status for rejection
 */
router.patch(
  "/:id/reject",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.rejectStockTake,
);

/**
 * @swagger
 * /api/stock-takes/{id}/recount:
 *   patch:
 *     tags: [Stock Takes]
 *     summary: Recount stock-take
 *     description: Restart counting after rejection (rejected → started)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock-take restarted for recounting
 *       400:
 *         description: Only rejected stock-takes can be recounted
 */
router.patch(
  "/:id/recount",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  stockTakesController.recountStockTake,
);

export default router;
