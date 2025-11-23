import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const subscriptionPlans = sqliteTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name", { enum: ["Free", "Pro", "Enterprise"] })
    .notNull()
    .unique(),
  maxUsers: integer("max_users").notNull(), // -1 for unlimited
  features: text("features", { mode: "json" }).$type<string[]>().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),

  // Subscription
  subscriptionPlanId: text("subscription_plan_id")
    .notNull()
    .references(() => subscriptionPlans.id),
  subscriptionStatus: text("subscription_status", {
    enum: ["active", "inactive", "suspended", "grace_period"],
  })
    .notNull()
    .default("active"),
  subscriptionStartDate: integer("subscription_start_date", {
    mode: "timestamp",
  }).notNull(),
  subscriptionEndDate: integer("subscription_end_date", { mode: "timestamp" }),
  lastPaymentDate: integer("last_payment_date", { mode: "timestamp" }),
  gracePeriodEndsAt: integer("grace_period_ends_at", { mode: "timestamp" }),

  // Metadata
  dbPath: text("db_path").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Super admin users who manage the platform
export const superAdmins = sqliteTable("super_admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Refresh tokens for super admins
export const superAdminRefreshTokens = sqliteTable(
  "super_admin_refresh_tokens",
  {
    id: text("id").primaryKey(),
    superAdminId: text("super_admin_id")
      .notNull()
      .references(() => superAdmins.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
);
