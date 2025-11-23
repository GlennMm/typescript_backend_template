import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Shop Settings - Tenant-wide business details
export const shopSettings = sqliteTable("shop_settings", {
  id: text("id").primaryKey(),

  // Company Information
  companyName: text("company_name").notNull(),
  tradingName: text("trading_name"),

  // Tax & Legal
  vatNumber: text("vat_number"),
  tinNumber: text("tin_number"),
  businessRegistrationNumber: text("business_registration_number"),
  defaultTaxRate: real("default_tax_rate").notNull().default(0),

  // Headquarters Address
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  stateProvince: text("state_province"),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),

  // Contact
  phoneNumber: text("phone_number").notNull(),
  alternativePhone: text("alternative_phone"),
  email: text("email").notNull(),
  faxNumber: text("fax_number"),
  website: text("website"),

  // Business Defaults
  defaultCurrency: text("default_currency").notNull().default("USD"),
  defaultTimezone: text("default_timezone"),

  // Branding
  logoUrl: text("logo_url"),
  defaultReceiptHeader: text("default_receipt_header"),
  defaultReceiptFooter: text("default_receipt_footer"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Branches - Shop locations with inheritance capability
export const branches = sqliteTable("branches", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),

  // Inheritance Flags
  useShopVat: integer("use_shop_vat", { mode: "boolean" })
    .notNull()
    .default(true),
  useShopTin: integer("use_shop_tin", { mode: "boolean" })
    .notNull()
    .default(true),
  useShopBusinessReg: integer("use_shop_business_reg", { mode: "boolean" })
    .notNull()
    .default(true),
  useShopTaxRate: integer("use_shop_tax_rate", { mode: "boolean" })
    .notNull()
    .default(true),
  useShopAddress: integer("use_shop_address", { mode: "boolean" })
    .notNull()
    .default(false),
  useShopContact: integer("use_shop_contact", { mode: "boolean" })
    .notNull()
    .default(false),
  useShopCurrency: integer("use_shop_currency", { mode: "boolean" })
    .notNull()
    .default(true),
  useShopReceipts: integer("use_shop_receipts", { mode: "boolean" })
    .notNull()
    .default(true),

  // Tax & Legal (Branch-specific)
  vatNumber: text("vat_number"),
  tinNumber: text("tin_number"),
  businessRegistrationNumber: text("business_registration_number"),
  taxRate: real("tax_rate"),

  // Address (Branch-specific)
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  stateProvince: text("state_province"),
  postalCode: text("postal_code"),
  country: text("country"),

  // Contact (Branch-specific)
  phoneNumber: text("phone_number"),
  alternativePhone: text("alternative_phone"),
  email: text("email"),
  faxNumber: text("fax_number"),

  // Settings
  currency: text("currency"),
  timezone: text("timezone"),
  openingHours: text("opening_hours", { mode: "json" }), // JSON object

  // Branding
  receiptHeader: text("receipt_header"),
  receiptFooter: text("receipt_footer"),
  logoUrl: text("logo_url"),

  // Management
  managerId: text("manager_id").references(() => users.id, {
    onDelete: "set null",
  }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Users - Extended with branch assignment and new roles
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),

  // Role: Extended for POS system
  role: text("role", {
    enum: [
      "TenantAdmin",
      "TenantUser",
      "ShopOwner",
      "BranchManager",
      "Supervisor",
      "Cashier",
    ],
  })
    .notNull()
    .default("TenantUser"),

  // Primary Branch Assignment
  primaryBranchId: text("primary_branch_id").references(() => branches.id, {
    onDelete: "set null",
  }),

  // Activation
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  activatedAt: integer("activated_at", { mode: "timestamp" }),

  // OTP for first-time login
  otpHash: text("otp_hash"),
  otpExpiresAt: integer("otp_expires_at", { mode: "timestamp" }),
  requirePasswordChange: integer("require_password_change", { mode: "boolean" })
    .notNull()
    .default(false),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Staff Assignments - Track staff-branch relationships
export const staffAssignments = sqliteTable("staff_assignments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  branchId: text("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),

  // Role at this specific branch (optional, can inherit from user.role)
  roleAtBranch: text("role_at_branch", {
    enum: ["BranchManager", "Supervisor", "Cashier"],
  }),

  assignedAt: integer("assigned_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  assignedBy: text("assigned_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const refreshTokens = sqliteTable("refresh_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Product Categories - For organizing products
export const productCategories = sqliteTable("product_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: text("parent_id").references((): any => productCategories.id, {
    onDelete: "set null",
  }),
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .default(false),
  detail: text("detail"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Products - Tenant-wide product catalog
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  categoryId: text("category_id").references(() => productCategories.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  price: real("price").notNull(),
  cost: real("cost"),
  unit: text("unit").notNull().default("piece"), // piece, kg, liter, etc.
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Branch Inventory - Stock levels per branch
export const branchInventory = sqliteTable("branch_inventory", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  branchId: text("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull().default(0),
  minimumStock: real("minimum_stock").default(0), // For low stock alerts
  maximumStock: real("maximum_stock"),
  lastRestocked: integer("last_restocked", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Inventory Transfers - Track stock movement between branches
export const inventoryTransfers = sqliteTable("inventory_transfers", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  fromBranchId: text("from_branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  toBranchId: text("to_branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "completed"],
  })
    .notNull()
    .default("pending"),
  notes: text("notes"),
  requestedBy: text("requested_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  approvedBy: text("approved_by").references(() => users.id, {
    onDelete: "set null",
  }),
  requestedAt: integer("requested_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// Customers - Tenant-wide customer records
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
  loyaltyPoints: integer("loyalty_points").default(0),
  lastPurchaseAt: integer("last_purchase_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Currencies - Tenant-wide currency management
export const currencies = sqliteTable("currencies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // USD, EUR, GBP, etc.
  symbol: text("symbol").notNull(), // $, €, £, etc.
  exchangeRate: real("exchange_rate").notNull().default(1), // Relative to base currency
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .default(false), // Only ONE can be default
  detail: text("detail"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Payment Methods - Tenant-wide payment method templates
export const paymentMethods = sqliteTable("payment_methods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Cash, Credit Card, Mobile Money, etc.
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .default(false), // Multiple can be default
  detail: text("detail"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Branch Payment Methods - Branch-specific payment methods (visible only to that branch)
export const branchPaymentMethods = sqliteTable("branch_payment_methods", {
  id: text("id").primaryKey(),
  branchId: text("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),

  // Link to tenant-wide payment method (nullable for branch-created methods)
  paymentMethodId: text("payment_method_id").references(
    () => paymentMethods.id,
    { onDelete: "cascade" },
  ),

  // Branch-specific name (used when paymentMethodId is null)
  name: text("name"),
  detail: text("detail"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Suppliers - Tenant-wide supplier records
export const suppliers = sqliteTable("suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  vatNumber: text("vat_number"),
  tinNumber: text("tin_number"),
  contactPerson: text("contact_person"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Taxes - Tenant-wide tax definitions (branches inherit, cannot modify)
export const taxes = sqliteTable("taxes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // VAT, Sales Tax, etc.
  taxRate: real("tax_rate").notNull(), // e.g., 15.0 for 15%
  taxCode: text("tax_code"), // e.g., VAT001
  taxID: text("tax_id"), // External tax identifier
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Product Branch Taxes - Which taxes apply to which products at which branches
export const productBranchTaxes = sqliteTable("product_branch_taxes", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  branchId: text("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  taxId: text("tax_id")
    .notNull()
    .references(() => taxes.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
