import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getTenantDb } from "@/db";
import {
  inventoryLosses,
  inventoryLossItems,
  branchInventory,
  products,
  expenseCategories,
} from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";

// ============================================
// TYPES
// ============================================

interface CreateLossDto {
  branchId: string;
  lossType: "theft" | "breakage" | "expired" | "shrinkage" | "other";
  reason: string;
  referenceNumber?: string;
  lossDate?: Date;
  notes?: string;
  expenseCategoryId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
}

interface UpdateLossDto {
  lossType?: "theft" | "breakage" | "expired" | "shrinkage" | "other";
  reason?: string;
  referenceNumber?: string;
  lossDate?: Date;
  notes?: string;
  expenseCategoryId?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
}

interface LossFilters {
  branchId?: string;
  lossType?:
    | "theft"
    | "breakage"
    | "expired"
    | "shrinkage"
    | "other";
  status?: "draft" | "approved";
  startDate?: Date;
  endDate?: Date;
  minValue?: number;
  maxValue?: number;
}

// ============================================
// SERVICE
// ============================================

export class InventoryLossesService {
  /**
   * Generate sequential loss number for the year
   */
  private async generateLossNumber(tenantId: string): Promise<string> {
    const db = getTenantDb(tenantId);
    const currentYear = new Date().getFullYear();

    // Get latest loss number for this year
    const result = await db
      .select({ lossNumber: inventoryLosses.lossNumber })
      .from(inventoryLosses)
      .where(sql`${inventoryLosses.lossNumber} LIKE ${"LOSS" + currentYear + "-%"}`)
      .orderBy(desc(inventoryLosses.lossNumber))
      .limit(1);

    if (result.length === 0) {
      return `LOSS${currentYear}-00001`;
    }

    // Extract number and increment
    const lastNumber = result[0].lossNumber;
    const match = lastNumber.match(/LOSS\d{4}-(\d+)/);
    if (!match) {
      return `LOSS${currentYear}-00001`;
    }

    const nextNumber = (parseInt(match[1], 10) + 1).toString().padStart(5, "0");
    return `LOSS${currentYear}-${nextNumber}`;
  }

  /**
   * Create a new inventory loss record (draft status)
   */
  async createLoss(
    tenantId: string,
    data: CreateLossDto,
    createdBy: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new Error("At least one item is required");
    }

    // Generate loss number
    const lossNumber = await this.generateLossNumber(tenantId);

    // Calculate total value from items
    let totalValue = 0;
    const itemsToCreate = [];

    for (const item of data.items) {
      // Get product cost price
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const costPrice = product.cost || 0;
      const lineTotal = item.quantity * costPrice;
      totalValue += lineTotal;

      itemsToCreate.push({
        id: nanoid(),
        lossId: "", // Will be set after loss is created
        productId: item.productId,
        quantity: item.quantity,
        costPrice,
        lineTotal,
        notes: item.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Validate expense category if provided
    if (data.expenseCategoryId) {
      const [category] = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, data.expenseCategoryId))
        .limit(1);

      if (!category) {
        throw new Error("Expense category not found");
      }
    }

    // Create loss record
    const lossId = nanoid();
    const lossDate = data.lossDate || new Date();

    const [loss] = await db
      .insert(inventoryLosses)
      .values({
        id: lossId,
        lossNumber,
        branchId: data.branchId,
        lossType: data.lossType,
        reason: data.reason,
        referenceNumber: data.referenceNumber,
        totalValue,
        expenseCategoryId: data.expenseCategoryId,
        lossDate,
        notes: data.notes,
        status: "draft",
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create loss items
    for (const item of itemsToCreate) {
      item.lossId = lossId;
    }

    await db.insert(inventoryLossItems).values(itemsToCreate);

    // Return loss with items
    return this.getLossById(tenantId, lossId);
  }

  /**
   * Update a loss record (draft only)
   */
  async updateLoss(
    tenantId: string,
    lossId: string,
    data: UpdateLossDto,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    // Get existing loss
    const [existingLoss] = await db
      .select()
      .from(inventoryLosses)
      .where(eq(inventoryLosses.id, lossId))
      .limit(1);

    if (!existingLoss) {
      throw new Error("Inventory loss not found");
    }

    if (existingLoss.status !== "draft") {
      throw new Error("Only draft losses can be updated");
    }

    // If items are being updated, recalculate total value
    let totalValue = existingLoss.totalValue;

    if (data.items) {
      // Delete existing items
      await db
        .delete(inventoryLossItems)
        .where(eq(inventoryLossItems.lossId, lossId));

      // Create new items
      totalValue = 0;
      const itemsToCreate = [];

      for (const item of data.items) {
        // Get product cost price
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const costPrice = product.cost || 0;
        const lineTotal = item.quantity * costPrice;
        totalValue += lineTotal;

        itemsToCreate.push({
          id: nanoid(),
          lossId,
          productId: item.productId,
          quantity: item.quantity,
          costPrice,
          lineTotal,
          notes: item.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await db.insert(inventoryLossItems).values(itemsToCreate);
    }

    // Validate expense category if provided
    if (data.expenseCategoryId !== undefined) {
      if (data.expenseCategoryId) {
        const [category] = await db
          .select()
          .from(expenseCategories)
          .where(eq(expenseCategories.id, data.expenseCategoryId))
          .limit(1);

        if (!category) {
          throw new Error("Expense category not found");
        }
      }
    }

    // Update loss record
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.lossType !== undefined) updateData.lossType = data.lossType;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.referenceNumber !== undefined)
      updateData.referenceNumber = data.referenceNumber;
    if (data.lossDate !== undefined) updateData.lossDate = data.lossDate;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.expenseCategoryId !== undefined)
      updateData.expenseCategoryId = data.expenseCategoryId;
    if (data.items) updateData.totalValue = totalValue;

    await db
      .update(inventoryLosses)
      .set(updateData)
      .where(eq(inventoryLosses.id, lossId));

    return this.getLossById(tenantId, lossId);
  }

  /**
   * Delete a loss record (draft only)
   */
  async deleteLoss(tenantId: string, lossId: string): Promise<any> {
    const db = getTenantDb(tenantId);

    const [loss] = await db
      .select()
      .from(inventoryLosses)
      .where(eq(inventoryLosses.id, lossId))
      .limit(1);

    if (!loss) {
      throw new Error("Inventory loss not found");
    }

    if (loss.status !== "draft") {
      throw new Error("Only draft losses can be deleted");
    }

    // Delete loss (items will cascade)
    await db.delete(inventoryLosses).where(eq(inventoryLosses.id, lossId));

    return loss;
  }

  /**
   * Approve a loss and deduct stock
   */
  async approveLoss(
    tenantId: string,
    lossId: string,
    approvedBy: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    // Get loss with items
    const [loss] = await db
      .select()
      .from(inventoryLosses)
      .where(eq(inventoryLosses.id, lossId))
      .limit(1);

    if (!loss) {
      throw new Error("Inventory loss not found");
    }

    if (loss.status !== "draft") {
      throw new Error("Only draft losses can be approved");
    }

    // Get loss items
    const items = await db
      .select()
      .from(inventoryLossItems)
      .where(eq(inventoryLossItems.lossId, lossId));

    // Deduct stock for each item
    for (const item of items) {
      // Get current inventory
      const [inventory] = await db
        .select()
        .from(branchInventory)
        .where(
          and(
            eq(branchInventory.productId, item.productId),
            eq(branchInventory.branchId, loss.branchId),
          ),
        )
        .limit(1);

      if (!inventory) {
        throw new Error(
          `Inventory not found for product: ${item.productId} at branch: ${loss.branchId}`,
        );
      }

      if (inventory.quantity < item.quantity) {
        const [product] = await db
          .select({ name: products.name })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        throw new Error(
          `Insufficient stock for ${product?.name || item.productId}. Available: ${inventory.quantity}, Required: ${item.quantity}`,
        );
      }

      // Deduct stock
      await db
        .update(branchInventory)
        .set({
          quantity: inventory.quantity - item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(branchInventory.id, inventory.id));
    }

    // Update loss status
    await db
      .update(inventoryLosses)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inventoryLosses.id, lossId));

    return this.getLossById(tenantId, lossId);
  }

  /**
   * Get loss by ID with items
   */
  async getLossById(tenantId: string, lossId: string): Promise<any> {
    const db = getTenantDb(tenantId);

    const [loss] = await db
      .select()
      .from(inventoryLosses)
      .where(eq(inventoryLosses.id, lossId))
      .limit(1);

    if (!loss) {
      throw new Error("Inventory loss not found");
    }

    // Get items with product details
    const items = await db
      .select({
        id: inventoryLossItems.id,
        lossId: inventoryLossItems.lossId,
        productId: inventoryLossItems.productId,
        productName: products.name,
        productSku: products.sku,
        quantity: inventoryLossItems.quantity,
        costPrice: inventoryLossItems.costPrice,
        lineTotal: inventoryLossItems.lineTotal,
        notes: inventoryLossItems.notes,
        createdAt: inventoryLossItems.createdAt,
        updatedAt: inventoryLossItems.updatedAt,
      })
      .from(inventoryLossItems)
      .leftJoin(products, eq(inventoryLossItems.productId, products.id))
      .where(eq(inventoryLossItems.lossId, lossId));

    // Get expense category if linked
    let expenseCategory = null;
    if (loss.expenseCategoryId) {
      const [category] = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, loss.expenseCategoryId))
        .limit(1);
      expenseCategory = category || null;
    }

    return {
      ...loss,
      items,
      expenseCategory,
    };
  }

  /**
   * Get losses with filters
   */
  async getLosses(
    tenantId: string,
    filters: LossFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any[]> {
    const db = getTenantDb(tenantId);

    const conditions = [];

    if (filters.branchId) {
      conditions.push(eq(inventoryLosses.branchId, filters.branchId));
    }

    if (filters.lossType) {
      conditions.push(eq(inventoryLosses.lossType, filters.lossType));
    }

    if (filters.status) {
      conditions.push(eq(inventoryLosses.status, filters.status));
    }

    if (filters.startDate) {
      conditions.push(
        gte(
          inventoryLosses.lossDate,
          Math.floor(filters.startDate.getTime() / 1000),
        ),
      );
    }

    if (filters.endDate) {
      conditions.push(
        lte(
          inventoryLosses.lossDate,
          Math.floor(filters.endDate.getTime() / 1000),
        ),
      );
    }

    if (filters.minValue !== undefined) {
      conditions.push(gte(inventoryLosses.totalValue, filters.minValue));
    }

    if (filters.maxValue !== undefined) {
      conditions.push(lte(inventoryLosses.totalValue, filters.maxValue));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const losses = await db
      .select()
      .from(inventoryLosses)
      .where(whereClause)
      .orderBy(desc(inventoryLosses.lossDate))
      .limit(limit)
      .offset(offset);

    return losses;
  }

  /**
   * Get loss report with breakdowns
   */
  async getLossReport(
    tenantId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // Get approved losses in date range
    const losses = await db
      .select()
      .from(inventoryLosses)
      .where(
        and(
          eq(inventoryLosses.branchId, branchId),
          eq(inventoryLosses.status, "approved"),
          gte(inventoryLosses.lossDate, startTimestamp),
          lte(inventoryLosses.lossDate, endTimestamp),
        ),
      );

    // Calculate totals by type
    const byType = {
      theft: { count: 0, value: 0 },
      breakage: { count: 0, value: 0 },
      expired: { count: 0, value: 0 },
      shrinkage: { count: 0, value: 0 },
      other: { count: 0, value: 0 },
    };

    let totalLosses = 0;
    let totalValue = 0;

    for (const loss of losses) {
      totalLosses++;
      totalValue += loss.totalValue;

      byType[loss.lossType].count++;
      byType[loss.lossType].value += loss.totalValue;
    }

    // Get top products by loss value
    const topProducts = await db
      .select({
        productId: inventoryLossItems.productId,
        productName: products.name,
        productSku: products.sku,
        totalQuantity: sql<number>`SUM(${inventoryLossItems.quantity})`,
        totalValue: sql<number>`SUM(${inventoryLossItems.lineTotal})`,
      })
      .from(inventoryLossItems)
      .leftJoin(
        inventoryLosses,
        eq(inventoryLossItems.lossId, inventoryLosses.id),
      )
      .leftJoin(products, eq(inventoryLossItems.productId, products.id))
      .where(
        and(
          eq(inventoryLosses.branchId, branchId),
          eq(inventoryLosses.status, "approved"),
          gte(inventoryLosses.lossDate, startTimestamp),
          lte(inventoryLosses.lossDate, endTimestamp),
        ),
      )
      .groupBy(inventoryLossItems.productId, products.name, products.sku)
      .orderBy(desc(sql`SUM(${inventoryLossItems.lineTotal})`))
      .limit(10);

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalLosses,
        totalValue,
      },
      byType,
      topProducts,
    };
  }
}
