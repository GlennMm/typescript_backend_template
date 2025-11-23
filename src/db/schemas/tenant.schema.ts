import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),

  // Role: TenantAdmin or TenantUser
  role: text('role', { enum: ['TenantAdmin', 'TenantUser'] }).notNull().default('TenantUser'),

  // Activation
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  activatedAt: integer('activated_at', { mode: 'timestamp' }),

  // OTP for first-time login
  otpHash: text('otp_hash'),
  otpExpiresAt: integer('otp_expires_at', { mode: 'timestamp' }),
  requirePasswordChange: integer('require_password_change', { mode: 'boolean' }).notNull().default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
