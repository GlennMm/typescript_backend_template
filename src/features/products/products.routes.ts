import { Router } from "express";
import {
  authenticate,
  authorize,
  ensureTenantUser,
} from "../../middleware/auth";
import { checkSubscription } from "../../middleware/subscription";
import { resolveTenant } from "../../middleware/tenant";
import { ProductsController } from "./products.controller";

const router = Router();
const productsController = new ProductsController();

// All product routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

// Category Routes

// Get all categories (all authenticated users can view)
router.get("/categories", productsController.getAllCategories);

// Get category by ID (all authenticated users can view)
router.get("/categories/:id", productsController.getCategoryById);

// Create category (ShopOwner, TenantAdmin, BranchManager)
router.post(
  "/categories",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  productsController.createCategory,
);

// Update category (ShopOwner, TenantAdmin, BranchManager)
router.put(
  "/categories/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  productsController.updateCategory,
);

// Delete category (ShopOwner, TenantAdmin)
router.delete(
  "/categories/:id",
  authorize("ShopOwner", "TenantAdmin"),
  productsController.deleteCategory,
);

// Product Routes

// Get all products (all authenticated users can view)
router.get("/", productsController.getAllProducts);

// Get product by ID (all authenticated users can view)
router.get("/:id", productsController.getProductById);

// Create product (ShopOwner, TenantAdmin, BranchManager)
router.post(
  "/",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  productsController.createProduct,
);

// Update product (ShopOwner, TenantAdmin, BranchManager)
router.put(
  "/:id",
  authorize("ShopOwner", "TenantAdmin", "BranchManager"),
  productsController.updateProduct,
);

// Delete product (ShopOwner, TenantAdmin)
router.delete(
  "/:id",
  authorize("ShopOwner", "TenantAdmin"),
  productsController.deleteProduct,
);

export default router;
