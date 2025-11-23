import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { CustomersController } from "./customers.controller";

const router = Router();
const customersController = new CustomersController();

// All customer routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

// Get all customers (all authenticated users can view, supports search query param)
router.get("/", customersController.getAllCustomers);

// Get customer by ID (all authenticated users can view)
router.get("/:id", customersController.getCustomerById);

// Create customer (all authenticated users can create)
router.post("/", customersController.createCustomer);

// Update customer (all authenticated users can update)
router.put("/:id", customersController.updateCustomer);

// Delete customer (ShopOwner, TenantAdmin, BranchManager only)
router.delete(
  "/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  customersController.deleteCustomer,
);

export default router;
