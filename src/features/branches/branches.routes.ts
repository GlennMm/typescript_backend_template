import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { BranchesController } from "./branches.controller";

const router = Router();
const branchesController = new BranchesController();

// All branch routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

/**
 * @swagger
 * /api/branches:
 *   get:
 *     tags: [Branches]
 *     summary: Get all branches
 *     description: Retrieve all branches for the tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *     responses:
 *       200:
 *         description: List of branches
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
 *                     $ref: '#/components/schemas/Branch'
 */
router.get("/", branchesController.getAllBranches);

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     tags: [Branches]
 *     summary: Get branch by ID
 *     description: Retrieve a specific branch by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       404:
 *         description: Branch not found
 */
router.get("/:id", branchesController.getBranchById);

/**
 * @swagger
 * /api/branches/{id}/effective-settings:
 *   get:
 *     tags: [Branches]
 *     summary: Get effective branch settings
 *     description: Get branch settings with inheritance resolved (shows actual values considering shop-level inheritance)
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
 *         description: Effective branch settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     vatNumber:
 *                       type: string
 *                     tinNumber:
 *                       type: string
 *                     taxRate:
 *                       type: number
 *                     addressLine1:
 *                       type: string
 *                     city:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 */
router.get("/:id/effective-settings", branchesController.getEffectiveSettings);

/**
 * @swagger
 * /api/branches:
 *   post:
 *     tags: [Branches]
 *     summary: Create a new branch
 *     description: Create a new branch (ShopOwner or TenantAdmin only)
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
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: BR001
 *               name:
 *                 type: string
 *                 example: Main Branch
 *               managerId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               useShopVat:
 *                 type: boolean
 *                 default: true
 *               useShopTin:
 *                 type: boolean
 *                 default: true
 *               useShopAddress:
 *                 type: boolean
 *                 default: true
 *               vatNumber:
 *                 type: string
 *               tinNumber:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *               city:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/",
  authorize("ShopOwner", "TenantAdmin"),
  branchesController.createBranch,
);

/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     tags: [Branches]
 *     summary: Update branch
 *     description: Update branch details (ShopOwner, TenantAdmin, or BranchManager for own branch)
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
 *               managerId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               useShopVat:
 *                 type: boolean
 *               vatNumber:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *     responses:
 *       200:
 *         description: Branch updated successfully
 *       404:
 *         description: Branch not found
 */
router.put(
  "/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  branchesController.updateBranch,
);

/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     tags: [Branches]
 *     summary: Delete branch
 *     description: Delete a branch (ShopOwner or TenantAdmin only)
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
 *         description: Branch deleted successfully
 *       404:
 *         description: Branch not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete(
  "/:id",
  authorize("ShopOwner", "TenantAdmin"),
  branchesController.deleteBranch,
);

/**
 * @swagger
 * /api/branches/{id}/inherit:
 *   patch:
 *     tags: [Branches]
 *     summary: Toggle inheritance settings
 *     description: Toggle whether a branch inherits specific settings from shop settings
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
 *               useShopVat:
 *                 type: boolean
 *               useShopTin:
 *                 type: boolean
 *               useShopAddress:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Inheritance settings updated
 */
router.patch(
  "/:id/inherit",
  authorize("ShopOwner", "TenantAdmin"),
  branchesController.toggleInheritance,
);

/**
 * @swagger
 * /api/branches/{id}/staff:
 *   get:
 *     tags: [Staff]
 *     summary: Get branch staff
 *     description: Get all staff assigned to a specific branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: List of staff members
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
 *                       userId:
 *                         type: string
 *                       roleAtBranch:
 *                         type: string
 *                       assignedAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/:id/staff", branchesController.getBranchStaff);

/**
 * @swagger
 * /api/branches/{id}/staff:
 *   post:
 *     tags: [Staff]
 *     summary: Assign staff to branch
 *     description: Assign a user to work at a branch with a specific role
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               roleAtBranch:
 *                 type: string
 *                 enum: [BranchManager, Supervisor, Cashier]
 *                 example: Cashier
 *     responses:
 *       201:
 *         description: Staff assigned successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/:id/staff",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  branchesController.assignStaffToBranch,
);

/**
 * @swagger
 * /api/branches/{id}/staff/{userId}:
 *   delete:
 *     tags: [Staff]
 *     summary: Remove staff from branch
 *     description: Remove a staff member's assignment from a branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Branch ID
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Staff removed successfully
 *       404:
 *         description: Staff assignment not found
 */
router.delete(
  "/:id/staff/:userId",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  branchesController.removeStaffFromBranch,
);

/**
 * @swagger
 * /api/branches/staff/transfer:
 *   post:
 *     tags: [Staff]
 *     summary: Transfer staff between branches
 *     description: Transfer a staff member from one branch to another (ShopOwner or TenantAdmin only)
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
 *               - userId
 *               - fromBranchId
 *               - toBranchId
 *             properties:
 *               userId:
 *                 type: string
 *               fromBranchId:
 *                 type: string
 *               toBranchId:
 *                 type: string
 *               roleAtNewBranch:
 *                 type: string
 *                 enum: [BranchManager, Supervisor, Cashier]
 *     responses:
 *       200:
 *         description: Staff transferred successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Branch or staff assignment not found
 */
router.post(
  "/staff/transfer",
  authorize("ShopOwner", "TenantAdmin"),
  branchesController.transferStaff,
);

export default router;
