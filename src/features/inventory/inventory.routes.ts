import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { InventoryController } from "./inventory.controller";

const router = Router();
const inventoryController = new InventoryController();

// All inventory routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

/**
 * @swagger
 * /api/inventory/branches/{branchId}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get branch inventory
 *     description: Get all inventory items for a specific branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: branchId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch inventory list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inventory'
 */
router.get("/branches/:branchId", inventoryController.getBranchInventory);

/**
 * @swagger
 * /api/inventory/branches/{branchId}/products/{productId}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get product inventory at branch
 *     description: Get inventory details for a specific product at a specific branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: branchId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product inventory details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: Inventory record not found
 */
router.get(
  "/branches/:branchId/products/:productId",
  inventoryController.getProductInventoryAtBranch,
);

/**
 * @swagger
 * /api/inventory/branches/{branchId}/adjust:
 *   post:
 *     tags: [Inventory]
 *     summary: Adjust inventory
 *     description: Add or remove stock from inventory (positive to add, negative to remove)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: branchId
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
 *               - productId
 *               - quantityChange
 *             properties:
 *               productId:
 *                 type: string
 *               quantityChange:
 *                 type: number
 *                 example: 10
 *                 description: Positive to add, negative to remove
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inventory adjusted successfully
 *       400:
 *         description: Insufficient stock or validation error
 */
router.post(
  "/branches/:branchId/adjust",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  inventoryController.adjustInventory,
);

/**
 * @swagger
 * /api/inventory/branches/{branchId}/set:
 *   put:
 *     tags: [Inventory]
 *     summary: Set inventory quantity
 *     description: Set the exact inventory quantity (replaces current value)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: branchId
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
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 example: 100
 *               minimumStock:
 *                 type: number
 *                 example: 10
 *               maximumStock:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Inventory set successfully
 *       400:
 *         description: Validation error
 */
router.put(
  "/branches/:branchId/set",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  inventoryController.setInventory,
);

/**
 * @swagger
 * /api/inventory/branches/{branchId}/low-stock:
 *   get:
 *     tags: [Inventory]
 *     summary: Get low stock items
 *     description: Get all products at a branch with stock below minimum threshold
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
 *         description: Low stock items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inventory'
 */
router.get(
  "/branches/:branchId/low-stock",
  inventoryController.getLowStockItems,
);

/**
 * @swagger
 * /api/inventory/transfers:
 *   get:
 *     tags: [Transfers]
 *     summary: Get all inventory transfers
 *     description: Get all inventory transfers, optionally filtered by branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: branchId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by source or destination branch
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed]
 *         description: Filter by transfer status
 *     responses:
 *       200:
 *         description: List of inventory transfers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryTransfer'
 */
router.get("/transfers", inventoryController.getAllTransfers);

/**
 * @swagger
 * /api/inventory/transfers/{id}:
 *   get:
 *     tags: [Transfers]
 *     summary: Get transfer by ID
 *     description: Get details of a specific inventory transfer
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
 *         description: Transfer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InventoryTransfer'
 *       404:
 *         description: Transfer not found
 */
router.get("/transfers/:id", inventoryController.getTransferById);

/**
 * @swagger
 * /api/inventory/transfers:
 *   post:
 *     tags: [Transfers]
 *     summary: Create inventory transfer request
 *     description: Request to transfer inventory from one branch to another
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
 *               - productId
 *               - fromBranchId
 *               - toBranchId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               fromBranchId:
 *                 type: string
 *               toBranchId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 example: 50
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transfer request created successfully
 *       400:
 *         description: Insufficient inventory at source branch
 */
router.post(
  "/transfers",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  inventoryController.createTransfer,
);

/**
 * @swagger
 * /api/inventory/transfers/{id}/approve:
 *   patch:
 *     tags: [Transfers]
 *     summary: Approve or reject transfer
 *     description: Approve or reject a pending inventory transfer request
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
 *               - approve
 *             properties:
 *               approve:
 *                 type: boolean
 *                 description: true to approve, false to reject
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer approved/rejected successfully
 *       400:
 *         description: Transfer not in pending status
 *       404:
 *         description: Transfer not found
 */
router.patch(
  "/transfers/:id/approve",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  inventoryController.approveTransfer,
);

/**
 * @swagger
 * /api/inventory/transfers/{id}/complete:
 *   post:
 *     tags: [Transfers]
 *     summary: Complete inventory transfer
 *     description: Execute the inventory movement (deduct from source, add to destination)
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
 *         description: Transfer completed successfully
 *       400:
 *         description: Transfer not approved or insufficient stock
 *       404:
 *         description: Transfer not found
 */
router.post(
  "/transfers/:id/complete",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  inventoryController.completeTransfer,
);

export default router;
