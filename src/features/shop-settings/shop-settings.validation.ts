import { z } from "zod";

export const createShopSettingsSchema = z.object({
  // Company Information
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  tradingName: z.string().optional(),

  // Tax & Legal
  vatNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  defaultTaxRate: z.number().min(0).max(100).default(0),

  // Headquarters Address
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  stateProvince: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(2, "Country is required"),

  // Contact
  phoneNumber: z.string().min(1, "Phone number is required"),
  alternativePhone: z.string().optional(),
  email: z.string().email("Invalid email address"),
  faxNumber: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),

  // Business Defaults
  defaultCurrency: z.string().length(3, "Currency must be 3-letter ISO code").default("USD"),
  defaultTimezone: z.string().optional(),

  // Branding
  logoUrl: z.string().optional(),
  defaultReceiptHeader: z.string().optional(),
  defaultReceiptFooter: z.string().optional(),
});

export const updateShopSettingsSchema = z.object({
  // Company Information
  companyName: z.string().min(2, "Company name must be at least 2 characters").optional(),
  tradingName: z.string().optional(),

  // Tax & Legal
  vatNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),

  // Headquarters Address
  addressLine1: z.string().min(1, "Address line 1 is required").optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required").optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required").optional(),
  country: z.string().min(2, "Country is required").optional(),

  // Contact
  phoneNumber: z.string().min(1, "Phone number is required").optional(),
  alternativePhone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  faxNumber: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),

  // Business Defaults
  defaultCurrency: z.string().length(3, "Currency must be 3-letter ISO code").optional(),
  defaultTimezone: z.string().optional(),

  // Branding
  logoUrl: z.string().optional(),
  defaultReceiptHeader: z.string().optional(),
  defaultReceiptFooter: z.string().optional(),
});

export type CreateShopSettingsDto = z.infer<typeof createShopSettingsSchema>;
export type UpdateShopSettingsDto = z.infer<typeof updateShopSettingsSchema>;
