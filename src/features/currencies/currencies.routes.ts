import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { CurrenciesController } from "./currencies.controller";

const router = Router();
const currenciesController = new CurrenciesController();

// All currency routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

/**
 * @swagger
 * /api/currencies:
 *   get:
 *     tags: [Currencies]
 *     summary: Get all currencies
 *     description: Retrieve all currencies for the tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *     responses:
 *       200:
 *         description: List of currencies
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
 *                       symbol:
 *                         type: string
 *                       exchangeRate:
 *                         type: number
 *                       isDefault:
 *                         type: boolean
 *                       detail:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 */
router.get("/", currenciesController.getAllCurrencies);

/**
 * @swagger
 * /api/currencies/{id}:
 *   get:
 *     tags: [Currencies]
 *     summary: Get currency by ID
 *     description: Retrieve a specific currency by its ID
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
 *         description: Currency details
 *       404:
 *         description: Currency not found
 */
router.get("/:id", currenciesController.getCurrencyById);

/**
 * @swagger
 * /api/currencies:
 *   post:
 *     tags: [Currencies]
 *     summary: Create currency
 *     description: Create a new currency (ShopOwner, TenantAdmin, BranchManager, or Supervisor)
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
 *               - symbol
 *               - exchangeRate
 *             properties:
 *               name:
 *                 type: string
 *                 example: US Dollar
 *               symbol:
 *                 type: string
 *                 example: $
 *               exchangeRate:
 *                 type: number
 *                 example: 1.0
 *                 description: Exchange rate relative to base currency
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *               detail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Currency created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  currenciesController.createCurrency,
);

/**
 * @swagger
 * /api/currencies/{id}:
 *   put:
 *     tags: [Currencies]
 *     summary: Update currency
 *     description: Update an existing currency
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
 *               symbol:
 *                 type: string
 *               exchangeRate:
 *                 type: number
 *               isDefault:
 *                 type: boolean
 *               detail:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Currency updated successfully
 *       404:
 *         description: Currency not found
 */
router.put(
  "/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  currenciesController.updateCurrency,
);

/**
 * @swagger
 * /api/currencies/{id}:
 *   delete:
 *     tags: [Currencies]
 *     summary: Delete currency
 *     description: Delete a currency (cannot delete default currency)
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
 *         description: Currency deleted successfully
 *       400:
 *         description: Cannot delete default currency
 *       404:
 *         description: Currency not found
 */
router.delete(
  "/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  currenciesController.deleteCurrency,
);

/**
 * @swagger
 * /api/currencies/{id}/set-default:
 *   patch:
 *     tags: [Currencies]
 *     summary: Set default currency
 *     description: Set a currency as the default (base) currency
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
 *         description: Default currency set successfully
 *       404:
 *         description: Currency not found
 */
router.patch(
  "/:id/set-default",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  currenciesController.setDefaultCurrency,
);

export default router;
