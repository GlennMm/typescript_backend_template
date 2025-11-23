import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { PaymentMethodsController } from "./payment-methods.controller";

const router = Router();
const paymentMethodsController = new PaymentMethodsController();

// All payment method routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

// Tenant-wide Payment Methods

/**
 * @swagger
 * /api/payment-methods:
 *   get:
 *     tags: [Payment Methods]
 *     summary: Get all payment methods
 *     description: Retrieve all tenant-wide payment methods
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *     responses:
 *       200:
 *         description: List of payment methods
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       isDefault:
 *                         type: boolean
 *                       detail:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 */
router.get("/", paymentMethodsController.getAllPaymentMethods);

/**
 * @swagger
 * /api/payment-methods/{id}:
 *   get:
 *     tags: [Payment Methods]
 *     summary: Get payment method by ID
 *     description: Retrieve a specific payment method by its ID
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
 *         description: Payment method details
 *       404:
 *         description: Payment method not found
 */
router.get("/:id", paymentMethodsController.getPaymentMethodById);

/**
 * @swagger
 * /api/payment-methods:
 *   post:
 *     tags: [Payment Methods]
 *     summary: Create payment method
 *     description: Create a new tenant-wide payment method
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cash
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *               detail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment method created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  paymentMethodsController.createPaymentMethod,
);

/**
 * @swagger
 * /api/payment-methods/{id}:
 *   put:
 *     tags: [Payment Methods]
 *     summary: Update payment method
 *     description: Update an existing payment method
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
 *             properties:
 *               name:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               detail:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *       404:
 *         description: Payment method not found
 */
router.put(
  "/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  paymentMethodsController.updatePaymentMethod,
);

/**
 * @swagger
 * /api/payment-methods/{id}:
 *   delete:
 *     tags: [Payment Methods]
 *     summary: Delete payment method
 *     description: Delete a tenant-wide payment method
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
 *         description: Payment method deleted successfully
 *       404:
 *         description: Payment method not found
 */
router.delete(
  "/:id",
  authorize("ShopOwner", "TenantAdmin"),
  paymentMethodsController.deletePaymentMethod,
);

// Branch Payment Methods

/**
 * @swagger
 * /api/payment-methods/branches/{branchId}:
 *   get:
 *     tags: [Payment Methods]
 *     summary: Get branch payment methods
 *     description: Get all payment methods available for a specific branch (both tenant-wide and branch-specific)
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
 *         description: List of branch payment methods
 */
router.get(
  "/branches/:branchId",
  paymentMethodsController.getBranchPaymentMethods,
);

/**
 * @swagger
 * /api/payment-methods/branches/{branchId}:
 *   post:
 *     tags: [Payment Methods]
 *     summary: Create branch payment method
 *     description: Link a tenant-wide payment method to a branch OR create a branch-specific payment method
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
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 description: ID of tenant-wide payment method to link (mutually exclusive with name)
 *               name:
 *                 type: string
 *                 description: Name for branch-specific payment method (mutually exclusive with paymentMethodId)
 *               detail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch payment method created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/branches/:branchId",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  paymentMethodsController.createBranchPaymentMethod,
);

/**
 * @swagger
 * /api/payment-methods/branches/methods/{id}:
 *   put:
 *     tags: [Payment Methods]
 *     summary: Update branch payment method
 *     description: Update a branch-specific payment method
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
 *             properties:
 *               name:
 *                 type: string
 *               detail:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Branch payment method updated successfully
 *       404:
 *         description: Branch payment method not found
 */
router.put(
  "/branches/methods/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  paymentMethodsController.updateBranchPaymentMethod,
);

/**
 * @swagger
 * /api/payment-methods/branches/methods/{id}:
 *   delete:
 *     tags: [Payment Methods]
 *     summary: Delete branch payment method
 *     description: Remove a payment method from a branch
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
 *         description: Branch payment method deleted successfully
 *       404:
 *         description: Branch payment method not found
 */
router.delete(
  "/branches/methods/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  paymentMethodsController.deleteBranchPaymentMethod,
);

export default router;
