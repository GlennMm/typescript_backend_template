import { nanoid } from "nanoid";
import { getTenantDb } from "./connection";
import {
  currencies,
  paymentMethods,
  taxes,
  productCategories,
} from "./schemas/tenant.schema";

/**
 * Seed common data for a tenant database
 * This should be called after creating a new tenant
 */
export async function seedTenantData(tenantId: string) {
  console.log(`🌱 Seeding data for tenant ${tenantId}...`);

  const db = getTenantDb(tenantId);

  // Seed common currencies
  console.log("💱 Creating currencies...");
  const commonCurrencies = [
    {
      id: nanoid(),
      name: "USD",
      symbol: "$",
      exchangeRate: 1.0,
      isDefault: true, // USD as default
      detail: "United States Dollar",
    },
    {
      id: nanoid(),
      name: "EUR",
      symbol: "€",
      exchangeRate: 0.85,
      isDefault: false,
      detail: "Euro",
    },
    {
      id: nanoid(),
      name: "GBP",
      symbol: "£",
      exchangeRate: 0.73,
      isDefault: false,
      detail: "British Pound Sterling",
    },
    {
      id: nanoid(),
      name: "JPY",
      symbol: "¥",
      exchangeRate: 110.0,
      isDefault: false,
      detail: "Japanese Yen",
    },
    {
      id: nanoid(),
      name: "AUD",
      symbol: "A$",
      exchangeRate: 1.35,
      isDefault: false,
      detail: "Australian Dollar",
    },
    {
      id: nanoid(),
      name: "CAD",
      symbol: "C$",
      exchangeRate: 1.25,
      isDefault: false,
      detail: "Canadian Dollar",
    },
  ];

  for (const currency of commonCurrencies) {
    await db.insert(currencies).values(currency).onConflictDoNothing();
  }
  console.log("✅ Currencies created");

  // Seed common payment methods
  console.log("💳 Creating payment methods...");
  const commonPaymentMethods = [
    {
      id: nanoid(),
      name: "Cash",
      isDefault: true,
      detail: "Physical cash payment",
    },
    {
      id: nanoid(),
      name: "Credit Card",
      isDefault: true,
      detail: "Payment via credit card",
    },
    {
      id: nanoid(),
      name: "Debit Card",
      isDefault: true,
      detail: "Payment via debit card",
    },
    {
      id: nanoid(),
      name: "Mobile Money",
      isDefault: false,
      detail: "Payment via mobile money platforms",
    },
    {
      id: nanoid(),
      name: "Bank Transfer",
      isDefault: false,
      detail: "Direct bank transfer payment",
    },
    {
      id: nanoid(),
      name: "Check",
      isDefault: false,
      detail: "Payment via check",
    },
  ];

  for (const method of commonPaymentMethods) {
    await db.insert(paymentMethods).values(method).onConflictDoNothing();
  }
  console.log("✅ Payment methods created");

  // Seed common taxes
  console.log("🧾 Creating taxes...");
  const commonTaxes = [
    {
      id: nanoid(),
      name: "VAT",
      taxRate: 15.0,
      taxCode: "VAT001",
      taxID: "VAT-STD",
      detail: "Standard Value Added Tax",
    },
    {
      id: nanoid(),
      name: "Sales Tax",
      taxRate: 7.5,
      taxCode: "SALES001",
      taxID: "SALES-STD",
      detail: "Standard Sales Tax",
    },
    {
      id: nanoid(),
      name: "Reduced VAT",
      taxRate: 5.0,
      taxCode: "VAT002",
      taxID: "VAT-RED",
      detail: "Reduced Value Added Tax (for essential goods)",
    },
    {
      id: nanoid(),
      name: "Zero Rated",
      taxRate: 0.0,
      taxCode: "ZERO001",
      taxID: "ZERO-RATED",
      detail: "Zero-rated tax for exempt items",
    },
  ];

  for (const tax of commonTaxes) {
    await db.insert(taxes).values(tax).onConflictDoNothing();
  }
  console.log("✅ Taxes created");

  // Seed default product category
  console.log("📦 Creating default product category...");
  const defaultCategory = {
    id: nanoid(),
    name: "General",
    description: "Default category for products",
    isDefault: true,
    detail: "Default category created automatically",
  };

  await db
    .insert(productCategories)
    .values(defaultCategory)
    .onConflictDoNothing();
  console.log("✅ Default product category created");

  console.log(`✅ Seeding completed for tenant ${tenantId}!`);
}

// If run directly from command line, seed the first tenant as example
if (import.meta.main) {
  const tenantId = process.argv[2];

  if (!tenantId) {
    console.error("❌ Please provide a tenant ID");
    console.error("Usage: bun src/db/tenant-seed.ts <tenantId>");
    process.exit(1);
  }

  seedTenantData(tenantId)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seeding failed:", err);
      process.exit(1);
    });
}
