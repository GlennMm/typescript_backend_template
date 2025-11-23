import { and, eq } from "drizzle-orm";
import { getTenantDb } from "@/db/tenant";
import { branches, tills } from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";

interface CreateTillDto {
  branchId: string;
  tillNumber: string;
  name: string;
}

interface UpdateTillDto {
  tillNumber?: string;
  name?: string;
  isActive?: boolean;
}

interface RegisterDeviceDto {
  deviceId: string;
  deviceName: string;
}

export class TillsService {
  /**
   * Create a new till
   */
  async createTill(
    tenantId: string,
    dto: CreateTillDto,
  ): Promise<typeof tills.$inferSelect> {
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

    // Check if till number already exists in this branch
    const [existing] = await db
      .select()
      .from(tills)
      .where(
        and(
          eq(tills.branchId, dto.branchId),
          eq(tills.tillNumber, dto.tillNumber),
        ),
      )
      .limit(1);

    if (existing) {
      throw new Error("Till number already exists in this branch");
    }

    const [till] = await db
      .insert(tills)
      .values({
        id: nanoid(),
        branchId: dto.branchId,
        tillNumber: dto.tillNumber,
        name: dto.name,
      })
      .returning();

    return till;
  }

  /**
   * Update a till
   */
  async updateTill(
    tenantId: string,
    tillId: string,
    dto: UpdateTillDto,
  ): Promise<typeof tills.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Get existing till
    const [existing] = await db
      .select()
      .from(tills)
      .where(eq(tills.id, tillId))
      .limit(1);

    if (!existing) {
      throw new Error("Till not found");
    }

    // If updating till number, check uniqueness
    if (dto.tillNumber && dto.tillNumber !== existing.tillNumber) {
      const [duplicate] = await db
        .select()
        .from(tills)
        .where(
          and(
            eq(tills.branchId, existing.branchId),
            eq(tills.tillNumber, dto.tillNumber),
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new Error("Till number already exists in this branch");
      }
    }

    const [updated] = await db
      .update(tills)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(tills.id, tillId))
      .returning();

    return updated;
  }

  /**
   * Register a device to a till
   */
  async registerDevice(
    tenantId: string,
    tillId: string,
    dto: RegisterDeviceDto,
  ): Promise<typeof tills.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Get existing till
    const [existing] = await db
      .select()
      .from(tills)
      .where(eq(tills.id, tillId))
      .limit(1);

    if (!existing) {
      throw new Error("Till not found");
    }

    // Check if device is already registered to another till
    const [otherTill] = await db
      .select()
      .from(tills)
      .where(eq(tills.deviceId, dto.deviceId))
      .limit(1);

    if (otherTill && otherTill.id !== tillId) {
      throw new Error(
        `Device is already registered to till ${otherTill.tillNumber}`,
      );
    }

    const [updated] = await db
      .update(tills)
      .set({
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
        updatedAt: new Date(),
      })
      .where(eq(tills.id, tillId))
      .returning();

    return updated;
  }

  /**
   * Unregister device from a till
   */
  async unregisterDevice(
    tenantId: string,
    tillId: string,
  ): Promise<typeof tills.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [updated] = await db
      .update(tills)
      .set({
        deviceId: null,
        deviceName: null,
        updatedAt: new Date(),
      })
      .where(eq(tills.id, tillId))
      .returning();

    if (!updated) {
      throw new Error("Till not found");
    }

    return updated;
  }

  /**
   * Get till by ID
   */
  async getTillById(
    tenantId: string,
    tillId: string,
  ): Promise<typeof tills.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [till] = await db
      .select()
      .from(tills)
      .where(eq(tills.id, tillId))
      .limit(1);

    if (!till) {
      throw new Error("Till not found");
    }

    return till;
  }

  /**
   * Get till by device ID
   */
  async getTillByDeviceId(
    tenantId: string,
    deviceId: string,
  ): Promise<typeof tills.$inferSelect | null> {
    const db = getTenantDb(tenantId);

    const [till] = await db
      .select()
      .from(tills)
      .where(eq(tills.deviceId, deviceId))
      .limit(1);

    return till || null;
  }

  /**
   * Get all tills for a branch
   */
  async getTillsByBranch(
    tenantId: string,
    branchId: string,
  ): Promise<(typeof tills.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(tills)
      .where(eq(tills.branchId, branchId))
      .orderBy(tills.tillNumber);
  }

  /**
   * Get all active tills for a branch
   */
  async getActiveTillsByBranch(
    tenantId: string,
    branchId: string,
  ): Promise<(typeof tills.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(tills)
      .where(and(eq(tills.branchId, branchId), eq(tills.isActive, true)))
      .orderBy(tills.tillNumber);
  }

  /**
   * Delete a till (soft delete by setting isActive to false)
   */
  async deleteTill(
    tenantId: string,
    tillId: string,
  ): Promise<typeof tills.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [deleted] = await db
      .update(tills)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(tills.id, tillId))
      .returning();

    if (!deleted) {
      throw new Error("Till not found");
    }

    return deleted;
  }
}
