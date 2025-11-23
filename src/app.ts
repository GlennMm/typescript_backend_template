import express from "express";
import authRoutes from "./features/auth/auth.routes";
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
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tenants", tenantsRoutes);

// 404 handler
app.use((req, res) => {
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
