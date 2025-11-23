import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
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
  mainSqlite.run("PRAGMA foreign_keys = ON");
  const mainDb = drizzle(mainSqlite);

  migrate(mainDb, { migrationsFolder: "./drizzle/main" });
  console.log("✅ Main database migrated successfully");

  // Migrate all tenant databases
  console.log("\n📊 Migrating tenant databases...");

  if (!existsSync(env.TENANT_DB_DIR)) {
    console.log("ℹ️  No tenant databases directory found, skipping tenant migrations");
  } else {
    const tenantFiles = readdirSync(env.TENANT_DB_DIR).filter(
      (file) => file.endsWith(".db")
    );

    if (tenantFiles.length === 0) {
      console.log("ℹ️  No tenant databases found, skipping tenant migrations");
    } else {
      console.log(`Found ${tenantFiles.length} tenant database(s)`);

      for (const tenantFile of tenantFiles) {
        const tenantId = tenantFile.replace(".db", "");
        const tenantDbPath = join(env.TENANT_DB_DIR, tenantFile);

        console.log(`  🔄 Migrating tenant: ${tenantId}...`);

        const tenantSqlite = new Database(tenantDbPath, { create: true });
        tenantSqlite.run("PRAGMA journal_mode = WAL");
        tenantSqlite.run("PRAGMA foreign_keys = ON");
        const tenantDb = drizzle(tenantSqlite);

        migrate(tenantDb, { migrationsFolder: "./drizzle/tenant" });
        console.log(`  ✅ Tenant ${tenantId} migrated successfully`);

        // Close the connection
        tenantSqlite.close();
      }

      console.log(`✅ All ${tenantFiles.length} tenant database(s) migrated successfully`);
    }
  }

  console.log("\n✅ All migrations completed!");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
