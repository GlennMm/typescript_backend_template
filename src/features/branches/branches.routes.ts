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

// Get all branches (all authenticated users can view)
router.get("/", branchesController.getAllBranches);

// Get branch by ID (all authenticated users can view)
router.get("/:id", branchesController.getBranchById);

// Get effective branch settings with inheritance resolved
router.get("/:id/effective-settings", branchesController.getEffectiveSettings);

// Create branch (ShopOwner, TenantAdmin only)
router.post(
  "/",
  authorize("ShopOwner", "TenantAdmin"),
  branchesController.createBranch,
);

// Update branch (ShopOwner, TenantAdmin, or BranchManager for own branch)
router.put(
  "/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  branchesController.updateBranch,
);

// Delete branch (ShopOwner, TenantAdmin only)
router.delete(
  "/:id",
  authorize("ShopOwner", "TenantAdmin"),
  branchesController.deleteBranch,
);

// Toggle inheritance for a specific field
router.patch(
  "/:id/inherit",
  authorize("ShopOwner", "TenantAdmin"),
  branchesController.toggleInheritance,
);

// Staff Management Routes

// Get branch staff (all authenticated users can view)
router.get("/:id/staff", branchesController.getBranchStaff);

// Assign staff to branch (ShopOwner, TenantAdmin, BranchManager)
router.post(
  "/:id/staff",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  branchesController.assignStaffToBranch,
);

// Remove staff from branch (ShopOwner, TenantAdmin, BranchManager)
router.delete(
  "/:id/staff/:userId",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  branchesController.removeStaffFromBranch,
);

// Transfer staff between branches (ShopOwner, TenantAdmin only)
router.post(
  "/staff/transfer",
  authorize("ShopOwner", "TenantAdmin"),
  branchesController.transferStaff,
);

export default router;
