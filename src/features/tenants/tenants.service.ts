import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { join } from "path";
import { env } from "../../config/env";
import { createTenantDb, getMainDb } from "../../db/connection";
import { subscriptionPlans, tenants } from "../../db/schemas/main.schema";
import { users } from "../../db/schemas/tenant.schema";
import { generateOTP, getOTPExpiration, hashOTP } from "../../utils/otp";
import { hashPassword } from "../../utils/password";
import type {
  CreateTenantDto,
  UpdateSubscriptionDto,
  UpdateTenantDto,
} from "./tenants.validation";

export class TenantsService {
  async getAllTenants() {
    const db = getMainDb();

    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        subscriptionStatus: tenants.subscriptionStatus,
        subscriptionStartDate: tenants.subscriptionStartDate,
        subscriptionEndDate: tenants.subscriptionEndDate,
        isActive: tenants.isActive,
        planName: subscriptionPlans.name,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .leftJoin(
        subscriptionPlans,
        eq(tenants.subscriptionPlanId, subscriptionPlans.id),
      );

    return allTenants;
  }

  async getTenantById(tenantId: string) {
    const db = getMainDb();

    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        subscriptionPlanId: tenants.subscriptionPlanId,
        subscriptionStatus: tenants.subscriptionStatus,
        subscriptionStartDate: tenants.subscriptionStartDate,
        subscriptionEndDate: tenants.subscriptionEndDate,
        lastPaymentDate: tenants.lastPaymentDate,
        gracePeriodEndsAt: tenants.gracePeriodEndsAt,
        isActive: tenants.isActive,
        dbPath: tenants.dbPath,
        planName: subscriptionPlans.name,
        maxUsers: subscriptionPlans.maxUsers,
        features: subscriptionPlans.features,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .leftJoin(
        subscriptionPlans,
        eq(tenants.subscriptionPlanId, subscriptionPlans.id),
      )
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    return tenant;
  }

  async createTenant(dto: CreateTenantDto) {
    const db = getMainDb();

    // Check if slug already exists
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, dto.slug))
      .limit(1);

    if (existingTenant) {
      throw new Error("Tenant with this slug already exists");
    }

    // Verify subscription plan exists
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, dto.subscriptionPlanId))
      .limit(1);

    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    const tenantId = nanoid();
    const dbPath = join(env.TENANT_DB_DIR, `${tenantId}.db`);

    // Create tenant record
    const [newTenant] = await db
      .insert(tenants)
      .values({
        id: tenantId,
        name: dto.name,
        slug: dto.slug,
        subscriptionPlanId: dto.subscriptionPlanId,
        subscriptionStatus: "active",
        subscriptionStartDate: new Date(),
        dbPath,
        isActive: true,
      })
      .returning();

    // Create tenant database
    const tenantDb = createTenantDb(tenantId);

    // Generate OTP for tenant admin instead of using provided password
    const otp = generateOTP(8); // 8-character alphanumeric OTP
    const otpHash = await hashOTP(otp);
    const otpExpiration = getOTPExpiration(); // 15 minutes from now

    // Create tenant admin user in the tenant database with OTP
    // Use the OTP as temporary password, but mark for password change
    await tenantDb.insert(users).values({
      id: nanoid(),
      email: dto.adminEmail,
      passwordHash: otpHash,
      name: dto.adminName,
      role: "TenantAdmin",
      isActive: true,
      activatedAt: new Date(),
      otpHash,
      otpExpiresAt: otpExpiration,
      requirePasswordChange: true,
    });

    return {
      id: newTenant.id,
      name: newTenant.name,
      slug: newTenant.slug,
      subscriptionStatus: newTenant.subscriptionStatus,
      planName: plan.name,
      otp, // Return the plain OTP to be shared with tenant admin
      otpExpiresAt: otpExpiration,
    };
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    const db = getMainDb();

    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!existingTenant) {
      throw new Error("Tenant not found");
    }

    const [updatedTenant] = await db
      .update(tenants)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return updatedTenant;
  }

  async updateSubscription(tenantId: string, dto: UpdateSubscriptionDto) {
    const db = getMainDb();

    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!existingTenant) {
      throw new Error("Tenant not found");
    }

    // If changing plan, verify it exists
    if (dto.subscriptionPlanId) {
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, dto.subscriptionPlanId))
        .limit(1);

      if (!plan) {
        throw new Error("Subscription plan not found");
      }
    }

    // Calculate grace period if status is changing to grace_period
    let gracePeriodEndsAt = existingTenant.gracePeriodEndsAt;
    if (dto.subscriptionStatus === "grace_period") {
      const now = new Date();
      gracePeriodEndsAt = new Date(
        now.getTime() +
          env.SUBSCRIPTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
      );
    }

    const updateData: any = {
      ...dto,
      updatedAt: new Date(),
    };

    if (dto.subscriptionEndDate) {
      updateData.subscriptionEndDate = new Date(dto.subscriptionEndDate);
    }

    if (gracePeriodEndsAt) {
      updateData.gracePeriodEndsAt = gracePeriodEndsAt;
    }

    const [updatedTenant] = await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantId))
      .returning();

    return updatedTenant;
  }

  async suspendTenant(tenantId: string) {
    return this.updateTenant(tenantId, { isActive: false });
  }

  async activateTenant(tenantId: string) {
    return this.updateTenant(tenantId, { isActive: true });
  }

  async deleteTenant(tenantId: string) {
    const db = getMainDb();

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    await db.delete(tenants).where(eq(tenants.id, tenantId));

    return { message: "Tenant deleted successfully" };
  }

  async getSubscriptionPlans() {
    const db = getMainDb();

    const plans = await db.select().from(subscriptionPlans);

    return plans;
  }
}
