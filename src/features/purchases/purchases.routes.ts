import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { PurchasesController } from "./purchases.controller";

const router = Router();
const purchasesController = new PurchasesController();

// All purchase routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     tags: [Purchases]
 *     summary: Create purchase order
 *     description: Create new purchase order in draft status
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
 *               - supplierId
 *               - items
 *             properties:
 *               branchId:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               purchaseDate:
 *                 type: string
 *                 format: date-time
 *               expectedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *               invoiceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *               shippingCost:
 *                 type: number
 *               taxApplied:
 *                 type: boolean
 *               taxAmount:
 *                 type: number
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - totalAmount
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     totalAmount:
 *                       type: number
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Purchase created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.createPurchase,
);

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     tags: [Purchases]
 *     summary: Get all purchases
 *     description: Get all purchases with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: branchId
 *         in: query
 *         schema:
 *           type: string
 *       - name: supplierId
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [draft, submitted, partially_paid, fully_paid, received]
 *     responses:
 *       200:
 *         description: List of purchases
 */
router.get(
  "/",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.getAllPurchases,
);

/**
 * @swagger
 * /api/purchases/unpaid:
 *   get:
 *     tags: [Purchases]
 *     summary: Get unpaid purchases
 *     description: Get purchases that are submitted or partially paid
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *     responses:
 *       200:
 *         description: List of unpaid purchases
 */
router.get(
  "/unpaid",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.getUnpaidPurchases,
);

/**
 * @swagger
 * /api/purchases/product/{productId}/history:
 *   get:
 *     tags: [Purchases]
 *     summary: Get purchase history for product
 *     description: Get all purchases containing a specific product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase history for product
 */
router.get(
  "/product/:productId/history",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.getProductPurchaseHistory,
);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     tags: [Purchases]
 *     summary: Get purchase by ID
 *     description: Get purchase details with items and payments
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
 *         description: Purchase details
 *       404:
 *         description: Purchase not found
 */
router.get(
  "/:id",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.getPurchaseById,
);

/**
 * @swagger
 * /api/purchases/{id}:
 *   put:
 *     tags: [Purchases]
 *     summary: Update purchase
 *     description: Update purchase (only in draft status)
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
 *     responses:
 *       200:
 *         description: Purchase updated
 *       400:
 *         description: Can only update draft purchases
 */
router.put(
  "/:id",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.updatePurchase,
);

/**
 * @swagger
 * /api/purchases/{id}/submit:
 *   patch:
 *     tags: [Purchases]
 *     summary: Submit purchase
 *     description: Submit purchase (draft → submitted)
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
 *         description: Purchase submitted
 */
router.patch(
  "/:id/submit",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.submitPurchase,
);

/**
 * @swagger
 * /api/purchases/{id}:
 *   delete:
 *     tags: [Purchases]
 *     summary: Cancel purchase
 *     description: Cancel purchase (only draft with no payments)
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
 *         description: Purchase cancelled
 *       400:
 *         description: Cannot cancel
 */
router.delete(
  "/:id",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.cancelPurchase,
);

/**
 * @swagger
 * /api/purchases/{id}/payments:
 *   post:
 *     tags: [Purchases]
 *     summary: Add payment
 *     description: Add payment to purchase (multi-currency support)
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
 *               - amount
 *               - currencyId
 *               - paymentMethodId
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *               currencyId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *               referenceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment added
 *       400:
 *         description: Validation error
 */
router.post(
  "/:id/payments",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.addPayment,
);

/**
 * @swagger
 * /api/purchases/payments/{paymentId}:
 *   delete:
 *     tags: [Purchases]
 *     summary: Delete payment
 *     description: Delete payment (only if goods not received)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted
 *       400:
 *         description: Cannot delete
 */
router.delete(
  "/payments/:paymentId",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.deletePayment,
);

/**
 * @swagger
 * /api/purchases/{id}/receive:
 *   post:
 *     tags: [Purchases]
 *     summary: Receive goods
 *     description: Receive goods (partial or full) and update inventory
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
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                     - quantityReceived
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     quantityReceived:
 *                       type: number
 *               actualDeliveryDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Goods received
 *       400:
 *         description: Validation error
 */
router.post(
  "/:id/receive",
  authorize("Supervisor", "BranchManager", "TenantAdmin", "ShopOwner"),
  purchasesController.receiveGoods,
);

export default router;
