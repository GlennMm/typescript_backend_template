import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import {
  tenantSettings,
  branchSettings,
  branchDiscounts,
  branches,
} from "../../db/schemas/tenant.schema";

interface UpdateTenantSettingsDto {
  quotationValidityDays?: number;
  taxMode?: "inclusive" | "exclusive";
  taxRate?: number;
  laybyFee?: number;
  cancellationFee?: number;
}

interface UpdateBranchSettingsDto {
  quotationValidityDays?: number;
  laybyDeposit?: number;
  cancellationFee?: number;
}

interface CreateDiscountDto {
  branchId: string;
  name: string;
  percentage: number;
}

interface UpdateDiscountDto {
  name?: string;
  percentage?: number;
  isActive?: boolean;
}

export class SettingsService {
  // Get or create tenant settings
  async getTenantSettings(tenantId: string) {
    const db = getTenantDb(tenantId);

    let [settings] = await db
      .select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, tenantId))
      .limit(1);

    // Create default settings if not exist
    if (!settings) {
      [settings] = await db
        .insert(tenantSettings)
        .values({
          id: nanoid(),
          tenantId,
          quotationValidityDays: 30,
          taxMode: "exclusive",
          taxRate: 0,
          laybyFee: 0,
          cancellationFee: 0,
        })
        .returning();
    }

    return settings;
  }

  // Update tenant settings
  async updateTenantSettings(
    tenantId: string,
    dto: UpdateTenantSettingsDto,
  ) {
    const db = getTenantDb(tenantId);

    // Get or create settings first
    const settings = await this.getTenantSettings(tenantId);

    const [updated] = await db
      .update(tenantSettings)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(tenantSettings.id, settings.id))
      .returning();

    return updated;
  }

  // Get branch settings (with inheritance from tenant)
  async getBranchSettings(tenantId: string, branchId: string) {
    const db = getTenantDb(tenantId);

    // Verify branch exists
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    // Get tenant settings
    const tenant = await this.getTenantSettings(tenantId);

    // Get branch settings
    let [branchSetting] = await db
      .select()
      .from(branchSettings)
      .where(eq(branchSettings.branchId, branchId))
      .limit(1);

    // Return effective settings (branch overrides or tenant defaults)
    return {
      branchId,
      quotationValidityDays:
        branchSetting?.quotationValidityDays ?? tenant.quotationValidityDays,
      laybyDeposit: branchSetting?.laybyDeposit ?? 0,
      cancellationFee: branchSetting?.cancellationFee ?? tenant.cancellationFee,
      taxMode: tenant.taxMode,
      taxRate: tenant.taxRate,
    };
  }

  // Update branch settings
  async updateBranchSettings(
    tenantId: string,
    branchId: string,
    dto: UpdateBranchSettingsDto,
  ) {
    const db = getTenantDb(tenantId);

    // Verify branch exists
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    // Check if settings exist
    let [existing] = await db
      .select()
      .from(branchSettings)
      .where(eq(branchSettings.branchId, branchId))
      .limit(1);

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(branchSettings)
        .set({
          ...dto,
          updatedAt: new Date(),
        })
        .where(eq(branchSettings.id, existing.id))
        .returning();

      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(branchSettings)
        .values({
          id: nanoid(),
          branchId,
          ...dto,
        })
        .returning();

      return created;
    }
  }

  // Get all active discounts for a branch
  async getBranchDiscounts(tenantId: string, branchId: string) {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(branchDiscounts)
      .where(eq(branchDiscounts.branchId, branchId));
  }

  // Get active discounts only
  async getActiveBranchDiscounts(tenantId: string, branchId: string) {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(branchDiscounts)
      .where(
        eq(branchDiscounts.branchId, branchId) &&
          eq(branchDiscounts.isActive, true),
      );
  }

  // Create discount
  async createDiscount(tenantId: string, dto: CreateDiscountDto) {
    const db = getTenantDb(tenantId);

    // Verify branch exists
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, dto.branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    const [discount] = await db
      .insert(branchDiscounts)
      .values({
        id: nanoid(),
        branchId: dto.branchId,
        name: dto.name,
        percentage: dto.percentage,
        isActive: true,
      })
      .returning();

    return discount;
  }

  // Update discount
  async updateDiscount(
    tenantId: string,
    discountId: string,
    dto: UpdateDiscountDto,
  ) {
    const db = getTenantDb(tenantId);

    const [updated] = await db
      .update(branchDiscounts)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(branchDiscounts.id, discountId))
      .returning();

    if (!updated) {
      throw new Error("Discount not found");
    }

    return updated;
  }

  // Delete discount (soft delete by setting isActive = false)
  async deleteDiscount(tenantId: string, discountId: string) {
    const db = getTenantDb(tenantId);

    const [deleted] = await db
      .update(branchDiscounts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(branchDiscounts.id, discountId))
      .returning();

    if (!deleted) {
      throw new Error("Discount not found");
    }

    return deleted;
  }
}
