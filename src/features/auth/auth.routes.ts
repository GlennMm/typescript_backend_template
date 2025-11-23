import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { AuthController } from "./auth.controller";

const router = Router();
const authController = new AuthController();

// Super Admin routes (no tenant required)
router.post("/admin/login", authController.loginSuperAdmin);

// Tenant user routes (require tenant header)
router.post(
  "/login",
  resolveTenant,
  checkSubscription,
  authController.loginTenantUser,
);
router.post(
  "/register",
  resolveTenant,
  checkSubscription,
  authController.registerTenantUser,
);

// Common routes
router.post("/refresh", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);

// Password management (requires authentication and tenant context)
router.post(
  "/change-password",
  resolveTenant,
  checkSubscription,
  authenticate,
  authController.changePassword,
);

export default router;
