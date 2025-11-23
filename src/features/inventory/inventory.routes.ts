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

// Branch Inventory Routes

// Get all inventory for a branch
router.get("/branches/:branchId", inventoryController.getBranchInventory);

// Get specific product inventory at a branch
router.get(
  "/branches/:branchId/products/:productId",
  inventoryController.getProductInventoryAtBranch,
);

// Adjust inventory (add or remove stock)
router.post(
  "/branches/:branchId/adjust",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  inventoryController.adjustInventory,
);

// Set inventory (replace quantity)
router.put(
  "/branches/:branchId/set",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  inventoryController.setInventory,
);

// Get low stock items for a branch
router.get(
  "/branches/:branchId/low-stock",
  inventoryController.getLowStockItems,
);

// Inventory Transfer Routes

// Get all transfers (optionally filtered by branchId query param)
router.get("/transfers", inventoryController.getAllTransfers);

// Get transfer by ID
router.get("/transfers/:id", inventoryController.getTransferById);

// Create transfer request
router.post(
  "/transfers",
  authorize("ShopOwner", "TenantAdmin", "BranchManager", "Supervisor"),
  inventoryController.createTransfer,
);

// Approve or reject transfer
router.patch(
  "/transfers/:id/approve",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  inventoryController.approveTransfer,
);

// Complete transfer (execute the inventory movement)
router.post(
  "/transfers/:id/complete",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  inventoryController.completeTransfer,
);

export default router;
