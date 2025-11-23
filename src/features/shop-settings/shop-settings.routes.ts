import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { ShopSettingsController } from "./shop-settings.controller";

const router = Router();
const shopSettingsController = new ShopSettingsController();

// All shop settings routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

/**
 * @swagger
 * /api/shop-settings:
 *   get:
 *     tags: [Shop Settings]
 *     summary: Get shop settings
 *     description: Retrieve the tenant-wide shop settings (ShopOwner or TenantAdmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/tenantId'
 *     responses:
 *       200:
 *         description: Shop settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ShopSettings'
 *       404:
 *         description: Shop settings not found
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/",
  authorize("ShopOwner", "TenantAdmin"),
  shopSettingsController.getShopSettings,
);

/**
 * @swagger
 * /api/shop-settings:
 *   post:
 *     tags: [Shop Settings]
 *     summary: Create shop settings
 *     description: Create initial shop settings for the tenant (ShopOwner or TenantAdmin only)
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
 *               - companyName
 *               - addressLine1
 *               - city
 *               - country
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: ABC Company Ltd
 *               tradingName:
 *                 type: string
 *               vatNumber:
 *                 type: string
 *               tinNumber:
 *                 type: string
 *               businessRegistrationNumber:
 *                 type: string
 *               defaultTaxRate:
 *                 type: number
 *                 example: 15
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *               stateProvince:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               alternativePhone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               faxNumber:
 *                 type: string
 *               website:
 *                 type: string
 *               defaultCurrency:
 *                 type: string
 *                 example: USD
 *               defaultTimezone:
 *                 type: string
 *                 example: UTC
 *               logoUrl:
 *                 type: string
 *               defaultReceiptHeader:
 *                 type: string
 *               defaultReceiptFooter:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shop settings created successfully
 *       400:
 *         description: Validation error or settings already exist
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/",
  authorize("ShopOwner", "TenantAdmin"),
  shopSettingsController.createShopSettings,
);

/**
 * @swagger
 * /api/shop-settings:
 *   put:
 *     tags: [Shop Settings]
 *     summary: Update shop settings
 *     description: Update existing shop settings (ShopOwner or TenantAdmin only)
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
 *             properties:
 *               companyName:
 *                 type: string
 *               tradingName:
 *                 type: string
 *               vatNumber:
 *                 type: string
 *               tinNumber:
 *                 type: string
 *               defaultTaxRate:
 *                 type: number
 *               addressLine1:
 *                 type: string
 *               city:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shop settings updated successfully
 *       404:
 *         description: Shop settings not found
 *       403:
 *         description: Insufficient permissions
 */
router.put(
  "/",
  authorize("ShopOwner", "TenantAdmin"),
  shopSettingsController.updateShopSettings,
);

export default router;
