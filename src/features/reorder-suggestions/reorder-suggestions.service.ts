import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { getTenantDb } from "@/db";
import {
  reorderSuggestions,
  branchInventory,
  products,
  purchases,
} from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";

// ============================================
// TYPES
// ============================================

interface SuggestionFilters {
  branchId?: string;
  productId?: string;
  status?: "pending" | "dismissed" | "snoozed" | "ordered";
}

// ============================================
// SERVICE
// ============================================

export class ReorderSuggestionsService {
  /**
   * Generate reorder suggestions for products below minimum stock
   * This should be run periodically (e.g., daily via cron)
   */
  async generateSuggestions(
    tenantId: string,
    branchId?: string,
  ): Promise<any[]> {
    const db = getTenantDb(tenantId);

    // Get all products below minimum stock
    const conditions = [
      sql`${branchInventory.quantity} <= ${branchInventory.minimumStock}`,
      sql`${branchInventory.minimumStock} > 0`, // Only check products with minimum stock set
    ];

    if (branchId) {
      conditions.push(eq(branchInventory.branchId, branchId));
    }

    const lowStockItems = await db
      .select({
        branchId: branchInventory.branchId,
        productId: branchInventory.productId,
        currentStock: branchInventory.quantity,
        minimumStock: branchInventory.minimumStock,
        maximumStock: branchInventory.maximumStock,
        productName: products.name,
        productSku: products.sku,
      })
      .from(branchInventory)
      .leftJoin(products, eq(branchInventory.productId, products.id))
      .where(and(...conditions));

    const newSuggestions = [];

    for (const item of lowStockItems) {
      // Check if suggestion already exists for this product/branch
      const [existingSuggestion] = await db
        .select()
        .from(reorderSuggestions)
        .where(
          and(
            eq(reorderSuggestions.branchId, item.branchId),
            eq(reorderSuggestions.productId, item.productId),
            or(
              eq(reorderSuggestions.status, "pending"),
              and(
                eq(reorderSuggestions.status, "snoozed"),
                sql`${reorderSuggestions.snoozedUntil} > ${Math.floor(Date.now() / 1000)}`,
              ),
            ),
          ),
        )
        .limit(1);

      // Skip if active suggestion already exists
      if (existingSuggestion) {
        continue;
      }

      // Calculate suggested quantity
      // Simple formula: order enough to reach maximum stock (or double minimum if no max set)
      const targetStock = item.maximumStock || item.minimumStock * 2;
      const suggestedQuantity = Math.max(
        targetStock - item.currentStock,
        item.minimumStock,
      );

      // Create suggestion
      const [suggestion] = await db
        .insert(reorderSuggestions)
        .values({
          id: nanoid(),
          branchId: item.branchId,
          productId: item.productId,
          currentStock: item.currentStock,
          minimumStock: item.minimumStock,
          suggestedQuantity,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      newSuggestions.push({
        ...suggestion,
        productName: item.productName,
        productSku: item.productSku,
      });
    }

    return newSuggestions;
  }

  /**
   * Get suggestions with filters
   */
  async getSuggestions(
    tenantId: string,
    filters: SuggestionFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any[]> {
    const db = getTenantDb(tenantId);

    const conditions = [];

    if (filters.branchId) {
      conditions.push(eq(reorderSuggestions.branchId, filters.branchId));
    }

    if (filters.productId) {
      conditions.push(eq(reorderSuggestions.productId, filters.productId));
    }

    if (filters.status) {
      conditions.push(eq(reorderSuggestions.status, filters.status));
    } else {
      // By default, only show active suggestions (pending or snoozed but not expired)
      conditions.push(
        or(
          eq(reorderSuggestions.status, "pending"),
          and(
            eq(reorderSuggestions.status, "snoozed"),
            or(
              isNull(reorderSuggestions.snoozedUntil),
              sql`${reorderSuggestions.snoozedUntil} <= ${Math.floor(Date.now() / 1000)}`,
            ),
          ),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const suggestions = await db
      .select({
        id: reorderSuggestions.id,
        branchId: reorderSuggestions.branchId,
        productId: reorderSuggestions.productId,
        productName: products.name,
        productSku: products.sku,
        currentStock: reorderSuggestions.currentStock,
        minimumStock: reorderSuggestions.minimumStock,
        suggestedQuantity: reorderSuggestions.suggestedQuantity,
        status: reorderSuggestions.status,
        snoozedUntil: reorderSuggestions.snoozedUntil,
        purchaseId: reorderSuggestions.purchaseId,
        notes: reorderSuggestions.notes,
        dismissedBy: reorderSuggestions.dismissedBy,
        dismissedAt: reorderSuggestions.dismissedAt,
        snoozedBy: reorderSuggestions.snoozedBy,
        snoozedAt: reorderSuggestions.snoozedAt,
        createdAt: reorderSuggestions.createdAt,
        updatedAt: reorderSuggestions.updatedAt,
      })
      .from(reorderSuggestions)
      .leftJoin(products, eq(reorderSuggestions.productId, products.id))
      .where(whereClause)
      .orderBy(desc(reorderSuggestions.createdAt))
      .limit(limit)
      .offset(offset);

    return suggestions;
  }

  /**
   * Get suggestion by ID
   */
  async getSuggestionById(
    tenantId: string,
    suggestionId: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const [suggestion] = await db
      .select({
        id: reorderSuggestions.id,
        branchId: reorderSuggestions.branchId,
        productId: reorderSuggestions.productId,
        productName: products.name,
        productSku: products.sku,
        currentStock: reorderSuggestions.currentStock,
        minimumStock: reorderSuggestions.minimumStock,
        suggestedQuantity: reorderSuggestions.suggestedQuantity,
        status: reorderSuggestions.status,
        snoozedUntil: reorderSuggestions.snoozedUntil,
        purchaseId: reorderSuggestions.purchaseId,
        notes: reorderSuggestions.notes,
        dismissedBy: reorderSuggestions.dismissedBy,
        dismissedAt: reorderSuggestions.dismissedAt,
        snoozedBy: reorderSuggestions.snoozedBy,
        snoozedAt: reorderSuggestions.snoozedAt,
        createdAt: reorderSuggestions.createdAt,
        updatedAt: reorderSuggestions.updatedAt,
      })
      .from(reorderSuggestions)
      .leftJoin(products, eq(reorderSuggestions.productId, products.id))
      .where(eq(reorderSuggestions.id, suggestionId))
      .limit(1);

    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    return suggestion;
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(
    tenantId: string,
    suggestionId: string,
    dismissedBy: string,
    notes?: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const [suggestion] = await db
      .select()
      .from(reorderSuggestions)
      .where(eq(reorderSuggestions.id, suggestionId))
      .limit(1);

    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.status === "dismissed") {
      throw new Error("Suggestion already dismissed");
    }

    if (suggestion.status === "ordered") {
      throw new Error("Cannot dismiss suggestion that has been ordered");
    }

    await db
      .update(reorderSuggestions)
      .set({
        status: "dismissed",
        dismissedBy,
        dismissedAt: new Date(),
        notes: notes || suggestion.notes,
        updatedAt: new Date(),
      })
      .where(eq(reorderSuggestions.id, suggestionId));

    return this.getSuggestionById(tenantId, suggestionId);
  }

  /**
   * Snooze a suggestion until a specific date
   */
  async snoozeSuggestion(
    tenantId: string,
    suggestionId: string,
    snoozedBy: string,
    snoozeUntil: Date,
    notes?: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const [suggestion] = await db
      .select()
      .from(reorderSuggestions)
      .where(eq(reorderSuggestions.id, suggestionId))
      .limit(1);

    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.status === "dismissed") {
      throw new Error("Cannot snooze dismissed suggestion");
    }

    if (suggestion.status === "ordered") {
      throw new Error("Cannot snooze suggestion that has been ordered");
    }

    if (snoozeUntil.getTime() <= Date.now()) {
      throw new Error("Snooze date must be in the future");
    }

    await db
      .update(reorderSuggestions)
      .set({
        status: "snoozed",
        snoozedBy,
        snoozedAt: new Date(),
        snoozedUntil: snoozeUntil,
        notes: notes || suggestion.notes,
        updatedAt: new Date(),
      })
      .where(eq(reorderSuggestions.id, suggestionId));

    return this.getSuggestionById(tenantId, suggestionId);
  }

  /**
   * Mark suggestion as ordered (link to purchase order)
   */
  async markAsOrdered(
    tenantId: string,
    suggestionId: string,
    purchaseId: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const [suggestion] = await db
      .select()
      .from(reorderSuggestions)
      .where(eq(reorderSuggestions.id, suggestionId))
      .limit(1);

    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    // Verify purchase exists
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      throw new Error("Purchase order not found");
    }

    await db
      .update(reorderSuggestions)
      .set({
        status: "ordered",
        purchaseId,
        updatedAt: new Date(),
      })
      .where(eq(reorderSuggestions.id, suggestionId));

    return this.getSuggestionById(tenantId, suggestionId);
  }

  /**
   * Get summary of pending suggestions by branch
   */
  async getSummaryByBranch(tenantId: string, branchId: string): Promise<any> {
    const db = getTenantDb(tenantId);

    const pendingSuggestions = await db
      .select()
      .from(reorderSuggestions)
      .where(
        and(
          eq(reorderSuggestions.branchId, branchId),
          eq(reorderSuggestions.status, "pending"),
        ),
      );

    const totalSuggestions = pendingSuggestions.length;
    const totalSuggestedValue = pendingSuggestions.reduce((sum, suggestion) => {
      return sum + suggestion.suggestedQuantity;
    }, 0);

    return {
      branchId,
      totalSuggestions,
      totalSuggestedQuantity: totalSuggestedValue,
      suggestions: pendingSuggestions,
    };
  }
}
