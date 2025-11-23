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

// Shop settings operations (ShopOwner or TenantAdmin only)
router.get(
  "/",
  authorize("ShopOwner", "TenantAdmin"),
  shopSettingsController.getShopSettings,
);

router.post(
  "/",
  authorize("ShopOwner", "TenantAdmin"),
  shopSettingsController.createShopSettings,
);

router.put(
  "/",
  authorize("ShopOwner", "TenantAdmin"),
  shopSettingsController.updateShopSettings,
);

export default router;
