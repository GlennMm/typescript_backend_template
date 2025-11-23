import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { env } from "../config/env";
import * as mainSchema from "./schemas/main.schema";
import * as tenantSchema from "./schemas/tenant.schema";

// Main database instance
let mainDbInstance: BunSQLiteDatabase<typeof mainSchema> | null = null;

// Tenant database cache
const tenantDbCache = new Map<string, BunSQLiteDatabase<typeof tenantSchema>>();

export function getMainDb(): BunSQLiteDatabase<typeof mainSchema> {
  if (!mainDbInstance) {
    // Ensure directory exists
    const dbDir = dirname(env.MAIN_DB_PATH);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    const sqlite = new Database(env.MAIN_DB_PATH, { create: true });
    sqlite.run("PRAGMA journal_mode = WAL");
    sqlite.run("PRAGMA foreign_keys = ON");

    mainDbInstance = drizzle(sqlite, { schema: mainSchema });
  }

  return mainDbInstance;
}

export function getTenantDb(
  tenantId: string,
): BunSQLiteDatabase<typeof tenantSchema> {
  const cached = tenantDbCache.get(tenantId);
  if (cached) {
    return cached;
  }

  const dbPath = join(env.TENANT_DB_DIR, `${tenantId}.db`);

  // Ensure directory exists
  if (!existsSync(env.TENANT_DB_DIR)) {
    mkdirSync(env.TENANT_DB_DIR, { recursive: true });
  }

  const sqlite = new Database(dbPath, { create: true });
  sqlite.run("PRAGMA journal_mode = WAL");
  sqlite.run("PRAGMA foreign_keys = ON");

  const db = drizzle(sqlite, { schema: tenantSchema });

  tenantDbCache.set(tenantId, db);

  return db;
}

export function createTenantDb(
  tenantId: string,
): BunSQLiteDatabase<typeof tenantSchema> {
  const dbPath = join(env.TENANT_DB_DIR, `${tenantId}.db`);

  // Ensure directory exists
  if (!existsSync(env.TENANT_DB_DIR)) {
    mkdirSync(env.TENANT_DB_DIR, { recursive: true });
  }

  const sqlite = new Database(dbPath, { create: true });
  sqlite.run("PRAGMA journal_mode = WAL");
  sqlite.run("PRAGMA foreign_keys = ON");

  const db = drizzle(sqlite, { schema: tenantSchema });

  // Run migrations for tenant database
  migrate(db, { migrationsFolder: "./drizzle/tenant" });

  tenantDbCache.set(tenantId, db);

  return db;
}

export function closeTenantDb(tenantId: string): void {
  tenantDbCache.delete(tenantId);
}

export function closeAllDbs(): void {
  mainDbInstance = null;
  tenantDbCache.clear();
}
