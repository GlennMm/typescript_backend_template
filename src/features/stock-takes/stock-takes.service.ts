import { and, eq, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import {
  branchInventory,
  branches,
  products,
  stockTakeItems,
  stockTakes,
  users,
} from "../../db/schemas/tenant.schema";

interface CreateStockTakeDto {
  branchId: string;
}

interface UpdateStockTakeItemDto {
  actualQuantity: number;
  notes?: string;
}

interface ApproveStockTakeDto {
  notes?: string;
}

interface RejectStockTakeDto {
  rejectionNotes: string;
}

export class StockTakesService {
  // Check if branch has an active stock-take
  async hasActiveStockTake(tenantId: string, branchId: string): Promise<boolean> {
    const db = getTenantDb(tenantId);

    const [activeStockTake] = await db
      .select()
      .from(stockTakes)
      .where(
        and(
          eq(stockTakes.branchId, branchId),
          or(
            eq(stockTakes.status, "started"),
            eq(stockTakes.status, "counted"),
          ),
        ),
      )
      .limit(1);

    return !!activeStockTake;
  }

  // Get active stock-take for a branch
  async getActiveStockTake(tenantId: string, branchId: string) {
    const db = getTenantDb(tenantId);

    const [activeStockTake] = await db
      .select()
      .from(stockTakes)
      .where(
        and(
          eq(stockTakes.branchId, branchId),
          or(
            eq(stockTakes.status, "started"),
            eq(stockTakes.status, "counted"),
          ),
        ),
      )
      .limit(1);

    return activeStockTake || null;
  }

  // Create new stock-take
  async createStockTake(
    tenantId: string,
    dto: CreateStockTakeDto,
    createdBy: string,
  ) {
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

    // Check if there's already an active stock-take for this branch
    const hasActive = await this.hasActiveStockTake(tenantId, dto.branchId);
    if (hasActive) {
      throw new Error(
        "Branch already has an active stock-take. Please complete or reject it first.",
      );
    }

    // Create stock-take
    const [newStockTake] = await db
      .insert(stockTakes)
      .values({
        id: nanoid(),
        branchId: dto.branchId,
        createdBy,
        status: "initialized",
      })
      .returning();

    // Get all products with their current inventory at this branch
    const branchProducts = await db
      .select({
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        quantity: branchInventory.quantity,
      })
      .from(products)
      .leftJoin(
        branchInventory,
        and(
          eq(branchInventory.productId, products.id),
          eq(branchInventory.branchId, dto.branchId),
        ),
      )
      .where(eq(products.isActive, true));

    // Create stock-take items with snapshots
    const items = branchProducts.map((product) => ({
      id: nanoid(),
      stockTakeId: newStockTake.id,
      productId: product.productId,
      expectedQuantity: product.quantity || 0,
    }));

    if (items.length > 0) {
      await db.insert(stockTakeItems).values(items);
    }

    return newStockTake;
  }

  // Get all stock-takes (tenant-wide view with optional branch filter)
  async getAllStockTakes(tenantId: string, branchId?: string) {
    const db = getTenantDb(tenantId);

    let query = db
      .select({
        id: stockTakes.id,
        branchId: stockTakes.branchId,
        branchName: branches.name,
        status: stockTakes.status,
        createdBy: stockTakes.createdBy,
        createdByName: sql<string>`creator.name`,
        startedBy: stockTakes.startedBy,
        countedBy: stockTakes.countedBy,
        approvedBy: stockTakes.approvedBy,
        createdAt: stockTakes.createdAt,
        startedAt: stockTakes.startedAt,
        countedAt: stockTakes.countedAt,
        approvedAt: stockTakes.approvedAt,
        rejectionNotes: stockTakes.rejectionNotes,
        updatedAt: stockTakes.updatedAt,
      })
      .from(stockTakes)
      .innerJoin(branches, eq(stockTakes.branchId, branches.id))
      .leftJoin(
        users,
        eq(stockTakes.createdBy, users.id),
      );

    if (branchId) {
      const results = await query.where(eq(stockTakes.branchId, branchId));
      return results;
    }

    return await query;
  }

  // Get stock-take by ID with items
  async getStockTakeById(tenantId: string, stockTakeId: string) {
    const db = getTenantDb(tenantId);

    const [stockTake] = await db
      .select({
        id: stockTakes.id,
        branchId: stockTakes.branchId,
        branchName: branches.name,
        status: stockTakes.status,
        createdBy: stockTakes.createdBy,
        startedBy: stockTakes.startedBy,
        countedBy: stockTakes.countedBy,
        approvedBy: stockTakes.approvedBy,
        createdAt: stockTakes.createdAt,
        startedAt: stockTakes.startedAt,
        countedAt: stockTakes.countedAt,
        approvedAt: stockTakes.approvedAt,
        rejectionNotes: stockTakes.rejectionNotes,
        updatedAt: stockTakes.updatedAt,
      })
      .from(stockTakes)
      .innerJoin(branches, eq(stockTakes.branchId, branches.id))
      .where(eq(stockTakes.id, stockTakeId))
      .limit(1);

    if (!stockTake) {
      throw new Error("Stock-take not found");
    }

    // Get items
    const items = await db
      .select({
        id: stockTakeItems.id,
        productId: stockTakeItems.productId,
        productName: products.name,
        productSku: products.sku,
        unit: products.unit,
        expectedQuantity: stockTakeItems.expectedQuantity,
        actualQuantity: stockTakeItems.actualQuantity,
        variance: stockTakeItems.variance,
        notes: stockTakeItems.notes,
        countedBy: stockTakeItems.countedBy,
        countedAt: stockTakeItems.countedAt,
        createdAt: stockTakeItems.createdAt,
        updatedAt: stockTakeItems.updatedAt,
      })
      .from(stockTakeItems)
      .innerJoin(products, eq(stockTakeItems.productId, products.id))
      .where(eq(stockTakeItems.stockTakeId, stockTakeId))
      .orderBy(products.name);

    return {
      ...stockTake,
      items,
    };
  }

  // Start stock-take (initialized → started)
  async startStockTake(
    tenantId: string,
    stockTakeId: string,
    startedBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const [stockTake] = await db
      .select()
      .from(stockTakes)
      .where(eq(stockTakes.id, stockTakeId))
      .limit(1);

    if (!stockTake) {
      throw new Error("Stock-take not found");
    }

    if (stockTake.status !== "initialized") {
      throw new Error("Stock-take must be in initialized status to start");
    }

    const [updated] = await db
      .update(stockTakes)
      .set({
        status: "started",
        startedBy,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stockTakes.id, stockTakeId))
      .returning();

    return updated;
  }

  // Update stock-take item count
  async updateStockTakeItem(
    tenantId: string,
    stockTakeId: string,
    itemId: string,
    dto: UpdateStockTakeItemDto,
    countedBy: string,
  ) {
    const db = getTenantDb(tenantId);

    // Verify stock-take exists and is in correct status
    const [stockTake] = await db
      .select()
      .from(stockTakes)
      .where(eq(stockTakes.id, stockTakeId))
      .limit(1);

    if (!stockTake) {
      throw new Error("Stock-take not found");
    }

    if (stockTake.status !== "started" && stockTake.status !== "counted") {
      throw new Error(
        "Can only update items when stock-take is in started or counted status",
      );
    }

    // Verify item exists
    const [item] = await db
      .select()
      .from(stockTakeItems)
      .where(eq(stockTakeItems.id, itemId))
      .limit(1);

    if (!item) {
      throw new Error("Stock-take item not found");
    }

    if (item.stockTakeId !== stockTakeId) {
      throw new Error("Item does not belong to this stock-take");
    }

    // Calculate variance
    const variance = dto.actualQuantity - item.expectedQuantity;

    const [updated] = await db
      .update(stockTakeItems)
      .set({
        actualQuantity: dto.actualQuantity,
        variance,
        notes: dto.notes,
        countedBy,
        countedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stockTakeItems.id, itemId))
      .returning();

    return updated;
  }

  // Complete counting (started → counted)
  async completeCount(
    tenantId: string,
    stockTakeId: string,
    countedBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const [stockTake] = await db
      .select()
      .from(stockTakes)
      .where(eq(stockTakes.id, stockTakeId))
      .limit(1);

    if (!stockTake) {
      throw new Error("Stock-take not found");
    }

    if (stockTake.status !== "started") {
      throw new Error("Stock-take must be in started status to complete count");
    }

    // Check if all items have been counted
    const [uncountedItem] = await db
      .select()
      .from(stockTakeItems)
      .where(
        and(
          eq(stockTakeItems.stockTakeId, stockTakeId),
          sql`${stockTakeItems.actualQuantity} IS NULL`,
        ),
      )
      .limit(1);

    if (uncountedItem) {
      throw new Error(
        "Cannot complete count - not all items have been counted",
      );
    }

    const [updated] = await db
      .update(stockTakes)
      .set({
        status: "counted",
        countedBy,
        countedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stockTakes.id, stockTakeId))
      .returning();

    return updated;
  }

  // Approve stock-take (counted → approved, apply adjustments)
  async approveStockTake(
    tenantId: string,
    stockTakeId: string,
    dto: ApproveStockTakeDto,
    approvedBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const [stockTake] = await db
      .select()
      .from(stockTakes)
      .where(eq(stockTakes.id, stockTakeId))
      .limit(1);

    if (!stockTake) {
      throw new Error("Stock-take not found");
    }

    if (stockTake.status !== "counted") {
      throw new Error("Stock-take must be in counted status to approve");
    }

    // Get all items with variance
    const items = await db
      .select()
      .from(stockTakeItems)
      .where(eq(stockTakeItems.stockTakeId, stockTakeId));

    // Apply adjustments to inventory
    for (const item of items) {
      if (item.actualQuantity === null) continue;

      // Update or create inventory record
      const [existingInventory] = await db
        .select()
        .from(branchInventory)
        .where(
          and(
            eq(branchInventory.branchId, stockTake.branchId),
            eq(branchInventory.productId, item.productId),
          ),
        )
        .limit(1);

      if (existingInventory) {
        await db
          .update(branchInventory)
          .set({
            quantity: item.actualQuantity,
            updatedAt: new Date(),
          })
          .where(eq(branchInventory.id, existingInventory.id));
      } else {
        // Create new inventory record
        await db.insert(branchInventory).values({
          id: nanoid(),
          branchId: stockTake.branchId,
          productId: item.productId,
          quantity: item.actualQuantity,
          minimumStock: 0,
        });
      }
    }

    // Update stock-take status
    const [updated] = await db
      .update(stockTakes)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stockTakes.id, stockTakeId))
      .returning();

    return updated;
  }

  // Reject stock-take (counted → rejected)
  async rejectStockTake(
    tenantId: string,
    stockTakeId: string,
    dto: RejectStockTakeDto,
    rejectedBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const [stockTake] = await db
      .select()
      .from(stockTakes)
      .where(eq(stockTakes.id, stockTakeId))
      .limit(1);

    if (!stockTake) {
      throw new Error("Stock-take not found");
    }

    if (stockTake.status !== "counted") {
      throw new Error("Stock-take must be in counted status to reject");
    }

    const [updated] = await db
      .update(stockTakes)
      .set({
        status: "rejected",
        rejectionNotes: dto.rejectionNotes,
        approvedBy: rejectedBy, // Use approvedBy to track who rejected
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stockTakes.id, stockTakeId))
      .returning();

    return updated;
  }

  // Recount (rejected → started)
  async recountStockTake(
    tenantId: string,
    stockTakeId: string,
    recountBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const [stockTake] = await db
      .select()
      .from(stockTakes)
      .where(eq(stockTakes.id, stockTakeId))
      .limit(1);

    if (!stockTake) {
      throw new Error("Stock-take not found");
    }

    if (stockTake.status !== "rejected") {
      throw new Error("Only rejected stock-takes can be recounted");
    }

    const [updated] = await db
      .update(stockTakes)
      .set({
        status: "started",
        startedBy: recountBy,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stockTakes.id, stockTakeId))
      .returning();

    return updated;
  }
}
