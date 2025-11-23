import { z } from "zod";

const openingHoursSchema = z.object({
  monday: z.union([
    z.object({ open: z.string(), close: z.string() }),
    z.object({ closed: z.literal(true) }),
  ]).optional(),
  tuesday: z.union([
    z.object({ open: z.string(), close: z.string() }),
    z.object({ closed: z.literal(true) }),
  ]).optional(),
  wednesday: z.union([
    z.object({ open: z.string(), close: z.string() }),
    z.object({ closed: z.literal(true) }),
  ]).optional(),
  thursday: z.union([
    z.object({ open: z.string(), close: z.string() }),
    z.object({ closed: z.literal(true) }),
  ]).optional(),
  friday: z.union([
    z.object({ open: z.string(), close: z.string() }),
    z.object({ closed: z.literal(true) }),
  ]).optional(),
  saturday: z.union([
    z.object({ open: z.string(), close: z.string() }),
    z.object({ closed: z.literal(true) }),
  ]).optional(),
  sunday: z.union([
    z.object({ open: z.string(), close: z.string() }),
    z.object({ closed: z.literal(true) }),
  ]).optional(),
});

export const createBranchSchema = z.object({
  code: z.string().min(1, "Branch code is required").max(50),
  name: z.string().min(2, "Branch name must be at least 2 characters"),

  // Inheritance Flags
  useShopVat: z.boolean().default(true),
  useShopTin: z.boolean().default(true),
  useShopBusinessReg: z.boolean().default(true),
  useShopTaxRate: z.boolean().default(true),
  useShopAddress: z.boolean().default(false),
  useShopContact: z.boolean().default(false),
  useShopCurrency: z.boolean().default(true),
  useShopReceipts: z.boolean().default(true),

  // Tax & Legal (Branch-specific)
  vatNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),

  // Address (Branch-specific)
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),

  // Contact (Branch-specific)
  phoneNumber: z.string().optional(),
  alternativePhone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  faxNumber: z.string().optional(),

  // Settings
  currency: z.string().length(3, "Currency must be 3-letter ISO code").optional().or(z.literal("")),
  timezone: z.string().optional(),
  openingHours: openingHoursSchema.optional(),

  // Branding
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  logoUrl: z.string().optional(),

  // Management
  managerId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBranchSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(2).optional(),

  // Inheritance Flags
  useShopVat: z.boolean().optional(),
  useShopTin: z.boolean().optional(),
  useShopBusinessReg: z.boolean().optional(),
  useShopTaxRate: z.boolean().optional(),
  useShopAddress: z.boolean().optional(),
  useShopContact: z.boolean().optional(),
  useShopCurrency: z.boolean().optional(),
  useShopReceipts: z.boolean().optional(),

  // Tax & Legal (Branch-specific)
  vatNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),

  // Address (Branch-specific)
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),

  // Contact (Branch-specific)
  phoneNumber: z.string().optional(),
  alternativePhone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  faxNumber: z.string().optional(),

  // Settings
  currency: z.string().length(3, "Currency must be 3-letter ISO code").optional().or(z.literal("")),
  timezone: z.string().optional(),
  openingHours: openingHoursSchema.optional(),

  // Branding
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  logoUrl: z.string().optional(),

  // Management
  managerId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const toggleInheritanceSchema = z.object({
  field: z.enum([
    "vat",
    "tin",
    "businessReg",
    "taxRate",
    "address",
    "contact",
    "currency",
    "receipts",
  ]),
  inherit: z.boolean(),
});

export type CreateBranchDto = z.infer<typeof createBranchSchema>;
export type UpdateBranchDto = z.infer<typeof updateBranchSchema>;
export type ToggleInheritanceDto = z.infer<typeof toggleInheritanceSchema>;
