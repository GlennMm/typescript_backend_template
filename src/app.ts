import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./features/auth/auth.routes";
import branchesRoutes from "./features/branches/branches.routes";
import currenciesRoutes from "./features/currencies/currencies.routes";
import customersRoutes from "./features/customers/customers.routes";
import inventoryRoutes from "./features/inventory/inventory.routes";
import paymentMethodsRoutes from "./features/payment-methods/payment-methods.routes";
import productsRoutes from "./features/products/products.routes";
import shopSettingsRoutes from "./features/shop-settings/shop-settings.routes";
import suppliersRoutes from "./features/suppliers/suppliers.routes";
import taxesRoutes from "./features/taxes/taxes.routes";
import tenantsRoutes from "./features/tenants/tenants.routes";
import usersRoutes from "./features/users/users.routes";
import { errorHandler } from "./middleware/errorHandler";
import {
  corsMiddleware,
  helmetMiddleware,
  rateLimiter,
} from "./middleware/security";
import logger from "./utils/logger";

const app = express();

// Security middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

// API Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "POS API Documentation",
}));

// Swagger JSON endpoint
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tenants", tenantsRoutes);
app.use("/api/shop/settings", shopSettingsRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/currencies", currenciesRoutes);
app.use("/api/payment-methods", paymentMethodsRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/taxes", taxesRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
      code: "NOT_FOUND",
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
