import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import { branches, shopSettings } from "../../db/schemas/tenant.schema";
import type { EffectiveBranchSettings } from "../../types";
import type {
  CreateBranchDto,
  ToggleInheritanceDto,
  UpdateBranchDto,
} from "./branches.validation";

export class BranchesService {
  async getAllBranches(tenantId: string) {
    const db = getTenantDb(tenantId);

    const allBranches = await db
      .select({
        id: branches.id,
        code: branches.code,
        name: branches.name,
        managerId: branches.managerId,
        isActive: branches.isActive,
        createdAt: branches.createdAt,
        updatedAt: branches.updatedAt,
      })
      .from(branches);

    return allBranches;
  }

  async getBranchById(tenantId: string, branchId: string) {
    const db = getTenantDb(tenantId);

    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    return branch;
  }

  async createBranch(tenantId: string, dto: CreateBranchDto) {
    const db = getTenantDb(tenantId);

    // Check if branch code already exists
    const [existingBranch] = await db
      .select()
      .from(branches)
      .where(eq(branches.code, dto.code))
      .limit(1);

    if (existingBranch) {
      throw new Error("Branch with this code already exists");
    }

    // Verify manager exists if provided
    if (dto.managerId) {
      const { users } = await import("../../db/schemas/tenant.schema");
      const [manager] = await db
        .select()
        .from(users)
        .where(eq(users.id, dto.managerId))
        .limit(1);

      if (!manager) {
        throw new Error("Manager not found");
      }
    }

    const [newBranch] = await db
      .insert(branches)
      .values({
        id: nanoid(),
        code: dto.code,
        name: dto.name,
        useShopVat: dto.useShopVat,
        useShopTin: dto.useShopTin,
        useShopBusinessReg: dto.useShopBusinessReg,
        useShopTaxRate: dto.useShopTaxRate,
        useShopAddress: dto.useShopAddress,
        useShopContact: dto.useShopContact,
        useShopCurrency: dto.useShopCurrency,
        useShopReceipts: dto.useShopReceipts,
        vatNumber: dto.vatNumber || null,
        tinNumber: dto.tinNumber || null,
        businessRegistrationNumber: dto.businessRegistrationNumber || null,
        taxRate: dto.taxRate || null,
        addressLine1: dto.addressLine1 || null,
        addressLine2: dto.addressLine2 || null,
        city: dto.city || null,
        stateProvince: dto.stateProvince || null,
        postalCode: dto.postalCode || null,
        country: dto.country || null,
        phoneNumber: dto.phoneNumber || null,
        alternativePhone: dto.alternativePhone || null,
        email: dto.email || null,
        faxNumber: dto.faxNumber || null,
        currency: dto.currency || null,
        timezone: dto.timezone || null,
        openingHours: dto.openingHours || null,
        receiptHeader: dto.receiptHeader || null,
        receiptFooter: dto.receiptFooter || null,
        logoUrl: dto.logoUrl || null,
        managerId: dto.managerId || null,
        isActive: dto.isActive,
      })
      .returning();

    return newBranch;
  }

  async updateBranch(tenantId: string, branchId: string, dto: UpdateBranchDto) {
    const db = getTenantDb(tenantId);

    // Check if branch exists
    const [existingBranch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!existingBranch) {
      throw new Error("Branch not found");
    }

    // If code is being updated, check if it's already taken
    if (dto.code && dto.code !== existingBranch.code) {
      const [codeTaken] = await db
        .select()
        .from(branches)
        .where(eq(branches.code, dto.code))
        .limit(1);

      if (codeTaken) {
        throw new Error("Branch code already in use");
      }
    }

    // Verify manager exists if provided
    if (dto.managerId) {
      const { users } = await import("../../db/schemas/tenant.schema");
      const [manager] = await db
        .select()
        .from(users)
        .where(eq(users.id, dto.managerId))
        .limit(1);

      if (!manager) {
        throw new Error("Manager not found");
      }
    }

    const [updatedBranch] = await db
      .update(branches)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, branchId))
      .returning();

    return updatedBranch;
  }

  async deleteBranch(tenantId: string, branchId: string) {
    const db = getTenantDb(tenantId);

    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    await db.delete(branches).where(eq(branches.id, branchId));

    return { message: "Branch deleted successfully" };
  }

  async getEffectiveBranchSettings(
    tenantId: string,
    branchId: string,
  ): Promise<EffectiveBranchSettings> {
    const db = getTenantDb(tenantId);

    // Get branch details
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    // Get shop settings
    const [shop] = await db.select().from(shopSettings).limit(1);

    if (!shop) {
      throw new Error("Shop settings not configured");
    }

    // Resolve effective settings based on inheritance flags
    const effectiveSettings: EffectiveBranchSettings = {
      vatNumber: branch.useShopVat ? shop.vatNumber : branch.vatNumber,
      tinNumber: branch.useShopTin ? shop.tinNumber : branch.tinNumber,
      businessRegistrationNumber: branch.useShopBusinessReg
        ? shop.businessRegistrationNumber
        : branch.businessRegistrationNumber,
      taxRate: branch.useShopTaxRate
        ? shop.defaultTaxRate
        : (branch.taxRate ?? 0),

      addressLine1: branch.useShopAddress
        ? shop.addressLine1
        : (branch.addressLine1 ?? shop.addressLine1),
      addressLine2: branch.useShopAddress
        ? shop.addressLine2
        : branch.addressLine2,
      city: branch.useShopAddress ? shop.city : (branch.city ?? shop.city),
      stateProvince: branch.useShopAddress
        ? shop.stateProvince
        : branch.stateProvince,
      postalCode: branch.useShopAddress
        ? shop.postalCode
        : (branch.postalCode ?? shop.postalCode),
      country: branch.useShopAddress
        ? shop.country
        : (branch.country ?? shop.country),

      phoneNumber: branch.useShopContact
        ? shop.phoneNumber
        : (branch.phoneNumber ?? shop.phoneNumber),
      alternativePhone: branch.useShopContact
        ? shop.alternativePhone
        : branch.alternativePhone,
      email: branch.useShopContact ? shop.email : (branch.email ?? shop.email),
      faxNumber: branch.useShopContact ? shop.faxNumber : branch.faxNumber,

      currency: branch.useShopCurrency
        ? shop.defaultCurrency
        : (branch.currency ?? shop.defaultCurrency),
      timezone: branch.timezone ?? shop.defaultTimezone,

      receiptHeader: branch.useShopReceipts
        ? shop.defaultReceiptHeader
        : branch.receiptHeader,
      receiptFooter: branch.useShopReceipts
        ? shop.defaultReceiptFooter
        : branch.receiptFooter,
      logoUrl: branch.useShopReceipts ? shop.logoUrl : branch.logoUrl,
    };

    return effectiveSettings;
  }

  async toggleInheritance(
    tenantId: string,
    branchId: string,
    dto: ToggleInheritanceDto,
  ) {
    const db = getTenantDb(tenantId);

    // Check if branch exists
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    // Map field names to database columns
    const fieldMap: Record<string, string> = {
      vat: "useShopVat",
      tin: "useShopTin",
      businessReg: "useShopBusinessReg",
      taxRate: "useShopTaxRate",
      address: "useShopAddress",
      contact: "useShopContact",
      currency: "useShopCurrency",
      receipts: "useShopReceipts",
    };

    const dbField = fieldMap[dto.field];

    const [updatedBranch] = await db
      .update(branches)
      .set({
        [dbField]: dto.inherit,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, branchId))
      .returning();

    return updatedBranch;
  }
}
