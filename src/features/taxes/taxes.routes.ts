import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { TaxesController } from "./taxes.controller";

const router = Router();
const taxesController = new TaxesController();

// All tax routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

/**
 * @swagger
 * /api/taxes:
 *   get:
 *     tags: [Taxes]
 *     summary: Get all taxes
 *     description: Retrieve all taxes for the tenant (all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *     responses:
 *       200:
 *         description: List of taxes
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
 *                     $ref: '#/components/schemas/Tax'
 */
router.get("/", taxesController.getAllTaxes);

/**
 * @swagger
 * /api/taxes/{id}:
 *   get:
 *     tags: [Taxes]
 *     summary: Get tax by ID
 *     description: Retrieve a specific tax by its ID
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
 *         description: Tax details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tax'
 *       404:
 *         description: Tax not found
 */
router.get("/:id", taxesController.getTaxById);

/**
 * @swagger
 * /api/taxes:
 *   post:
 *     tags: [Taxes]
 *     summary: Create tax
 *     description: Create a new tax (ShopOwner or TenantAdmin only)
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
 *               - taxRate
 *             properties:
 *               name:
 *                 type: string
 *                 example: VAT
 *               taxRate:
 *                 type: number
 *                 example: 15.0
 *               taxCode:
 *                 type: string
 *                 example: VAT001
 *               taxID:
 *                 type: string
 *                 example: EXT-TAX-12345
 *     responses:
 *       201:
 *         description: Tax created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/",
  authorize("ShopOwner", "TenantAdmin"),
  taxesController.createTax,
);

/**
 * @swagger
 * /api/taxes/{id}:
 *   put:
 *     tags: [Taxes]
 *     summary: Update tax
 *     description: Update an existing tax (ShopOwner or TenantAdmin only)
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
 *               taxRate:
 *                 type: number
 *               taxCode:
 *                 type: string
 *               taxID:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tax updated successfully
 *       404:
 *         description: Tax not found
 *       403:
 *         description: Insufficient permissions
 */
router.put(
  "/:id",
  authorize("ShopOwner", "TenantAdmin"),
  taxesController.updateTax,
);

/**
 * @swagger
 * /api/taxes/{id}:
 *   delete:
 *     tags: [Taxes]
 *     summary: Delete tax
 *     description: Delete a tax (ShopOwner or TenantAdmin only)
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
 *         description: Tax deleted successfully
 *       404:
 *         description: Tax not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete(
  "/:id",
  authorize("ShopOwner", "TenantAdmin"),
  taxesController.deleteTax,
);

/**
 * @swagger
 * /api/taxes/products/assign:
 *   post:
 *     tags: [Taxes]
 *     summary: Assign tax to product
 *     description: Assign a tax to a product at a specific branch (BranchManager or Supervisor)
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
 *               - branchId
 *               - taxId
 *             properties:
 *               productId:
 *                 type: string
 *                 example: prod_123
 *               branchId:
 *                 type: string
 *                 example: branch_456
 *               taxId:
 *                 type: string
 *                 example: tax_789
 *     responses:
 *       201:
 *         description: Tax assigned to product successfully
 *       400:
 *         description: Tax already assigned or validation error
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/products/assign",
  authorize("BranchManager", "Supervisor", "ShopOwner", "TenantAdmin"),
  taxesController.assignTaxToProduct,
);

/**
 * @swagger
 * /api/taxes/products/{productId}/branches/{branchId}/taxes/{taxId}:
 *   delete:
 *     tags: [Taxes]
 *     summary: Remove tax from product
 *     description: Remove a tax assignment from a product at a specific branch (BranchManager or Supervisor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: branchId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: taxId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tax removed from product successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.delete(
  "/products/:productId/branches/:branchId/taxes/:taxId",
  authorize("BranchManager", "Supervisor", "ShopOwner", "TenantAdmin"),
  taxesController.removeTaxFromProduct,
);

/**
 * @swagger
 * /api/taxes/products/{productId}/branches/{branchId}:
 *   get:
 *     tags: [Taxes]
 *     summary: Get product taxes at branch
 *     description: Retrieve all taxes assigned to a product at a specific branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: branchId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of taxes assigned to product at branch
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
 */
router.get(
  "/products/:productId/branches/:branchId",
  taxesController.getProductBranchTaxes,
);

export default router;
