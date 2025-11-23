import app from "./app";
import { env } from "./config/env";
import logger from "./utils/logger";

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
  logger.info(`📝 Environment: ${env.NODE_ENV}`);
  logger.info(`🗄️  Main DB: ${env.MAIN_DB_PATH}`);
  logger.info(`📂 Tenant DB Directory: ${env.TENANT_DB_DIR}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});
