import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tenants", tenantsRoutes);

// Serve static files from the React app
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDistPath));

// Handle React routing, return all requests to React app (except API routes)
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
