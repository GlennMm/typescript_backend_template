import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { env } from "../config/env";

async function runMigrations() {
  console.log("🔄 Running migrations...");

  // Migrate main database
  console.log("📊 Migrating main database...");
  const mainDbDir = dirname(env.MAIN_DB_PATH);
  if (!existsSync(mainDbDir)) {
    mkdirSync(mainDbDir, { recursive: true });
  }

  const mainSqlite = new Database(env.MAIN_DB_PATH, { create: true });
  mainSqlite.run("PRAGMA journal_mode = WAL");
  const mainDb = drizzle(mainSqlite);

  migrate(mainDb, { migrationsFolder: "./drizzle/main" });
  console.log("✅ Main database migrated successfully");

  // Note: Tenant databases are migrated when they are created
  console.log("✅ All migrations completed!");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
