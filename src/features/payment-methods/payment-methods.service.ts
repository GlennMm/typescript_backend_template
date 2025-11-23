import { and, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  paymentMethods,
  branchPaymentMethods,
} from "../../db/schemas/tenant.schema";
import { getTenantDb } from "@/db/connection";

export interface CreatePaymentMethodDto {
  name: string;
  isDefault?: boolean;
  detail?: string;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  isDefault?: boolean;
  detail?: string;
  isActive?: boolean;
}

export interface CreateBranchPaymentMethodDto {
  branchId: string;
  paymentMethodId?: string; // If linking to tenant-wide method
  name?: string; // If creating branch-specific method
  detail?: string;
}

export interface UpdateBranchPaymentMethodDto {
  name?: string;
  detail?: string;
  isActive?: boolean;
}

export class PaymentMethodsService {
  // Tenant-wide Payment Methods

  async getAllPaymentMethods(tenantId: string) {
    const db = getTenantDb(tenantId);
    return await db.select().from(paymentMethods).orderBy(paymentMethods.name);
  }

  async getPaymentMethodById(tenantId: string, paymentMethodId: string) {
    const db = getTenantDb(tenantId);
    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, paymentMethodId))
      .limit(1);

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    return paymentMethod;
  }

  async createPaymentMethod(tenantId: string, dto: CreatePaymentMethodDto) {
    const db = getTenantDb(tenantId);

    const [newPaymentMethod] = await db
      .insert(paymentMethods)
      .values({
        id: nanoid(),
        name: dto.name,
        isDefault: dto.isDefault ?? false,
        detail: dto.detail,
      })
      .returning();

    return newPaymentMethod;
  }

  async updatePaymentMethod(
    tenantId: string,
    paymentMethodId: string,
    dto: UpdatePaymentMethodDto,
  ) {
    const db = getTenantDb(tenantId);

    const [existing] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, paymentMethodId))
      .limit(1);

    if (!existing) {
      throw new Error("Payment method not found");
    }

    const [updated] = await db
      .update(paymentMethods)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethods.id, paymentMethodId))
      .returning();

    return updated;
  }

  async deletePaymentMethod(tenantId: string, paymentMethodId: string) {
    const db = getTenantDb(tenantId);

    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, paymentMethodId))
      .limit(1);

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    // Delete the payment method (cascade will handle branch links)
    await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, paymentMethodId));

    return { success: true };
  }

  // Branch Payment Methods

  async getBranchPaymentMethods(tenantId: string, branchId: string) {
    const db = getTenantDb(tenantId);

    // Get both branch-specific methods and tenant-wide methods linked to this branch
    const branchMethods = await db
      .select({
        id: branchPaymentMethods.id,
        branchId: branchPaymentMethods.branchId,
        paymentMethodId: branchPaymentMethods.paymentMethodId,
        name: branchPaymentMethods.name,
        detail: branchPaymentMethods.detail,
        isActive: branchPaymentMethods.isActive,
        createdAt: branchPaymentMethods.createdAt,
        // Include tenant-wide method details if linked
        tenantMethodName: paymentMethods.name,
        tenantMethodIsDefault: paymentMethods.isDefault,
      })
      .from(branchPaymentMethods)
      .leftJoin(
        paymentMethods,
        eq(branchPaymentMethods.paymentMethodId, paymentMethods.id),
      )
      .where(eq(branchPaymentMethods.branchId, branchId));

    return branchMethods;
  }

  async createBranchPaymentMethod(
    tenantId: string,
    dto: CreateBranchPaymentMethodDto,
  ) {
    const db = getTenantDb(tenantId);

    // Validate that either paymentMethodId or name is provided
    if (!dto.paymentMethodId && !dto.name) {
      throw new Error(
        "Either paymentMethodId (to link tenant method) or name (for branch-specific method) must be provided",
      );
    }

    // If linking to tenant-wide method, verify it exists
    if (dto.paymentMethodId) {
      const [exists] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, dto.paymentMethodId))
        .limit(1);

      if (!exists) {
        throw new Error("Tenant payment method not found");
      }
    }

    const [newBranchMethod] = await db
      .insert(branchPaymentMethods)
      .values({
        id: nanoid(),
        branchId: dto.branchId,
        paymentMethodId: dto.paymentMethodId,
        name: dto.name,
        detail: dto.detail,
      })
      .returning();

    return newBranchMethod;
  }

  async updateBranchPaymentMethod(
    tenantId: string,
    branchPaymentMethodId: string,
    dto: UpdateBranchPaymentMethodDto,
  ) {
    const db = getTenantDb(tenantId);

    const [existing] = await db
      .select()
      .from(branchPaymentMethods)
      .where(eq(branchPaymentMethods.id, branchPaymentMethodId))
      .limit(1);

    if (!existing) {
      throw new Error("Branch payment method not found");
    }

    const [updated] = await db
      .update(branchPaymentMethods)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(branchPaymentMethods.id, branchPaymentMethodId))
      .returning();

    return updated;
  }

  async deleteBranchPaymentMethod(
    tenantId: string,
    branchPaymentMethodId: string,
  ) {
    const db = getTenantDb(tenantId);

    const [branchMethod] = await db
      .select()
      .from(branchPaymentMethods)
      .where(eq(branchPaymentMethods.id, branchPaymentMethodId))
      .limit(1);

    if (!branchMethod) {
      throw new Error("Branch payment method not found");
    }

    await db
      .delete(branchPaymentMethods)
      .where(eq(branchPaymentMethods.id, branchPaymentMethodId));

    return { success: true };
  }
}
