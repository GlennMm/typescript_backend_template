import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { getTenantDb } from "@/db";
import {
  returns,
  returnItems,
  returnRefunds,
  sales,
  saleItems,
  laybys,
  laybyItems,
  quotations,
  quotationItems,
  branchInventory,
  branchSettings,
  inventoryLosses,
  inventoryLossItems,
  products,
  currencies,
  shifts,
} from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";
import { InventoryLossesService } from "../inventory-losses/inventory-losses.service";

const inventoryLossesService = new InventoryLossesService();

// ============================================
// TYPES
// ============================================

interface CreateReturnDto {
  branchId: string;
  saleId?: string;
  laybyId?: string;
  quotationId?: string;
  reason: string;
  notes?: string;
  returnDate?: Date;
  items: Array<{
    saleItemId?: string;
    laybyItemId?: string;
    quotationItemId?: string;
    productId: string;
    quantity: number;
    condition: "good" | "damaged";
    conditionNotes?: string;
    notes?: string;
  }>;
}

interface UpdateReturnDto {
  reason?: string;
  notes?: string;
  returnDate?: Date;
  items?: Array<{
    saleItemId?: string;
    laybyItemId?: string;
    quotationItemId?: string;
    productId: string;
    quantity: number;
    condition: "good" | "damaged";
    conditionNotes?: string;
    notes?: string;
  }>;
}

interface AddRefundDto {
  amount: number;
  currencyId: string;
  paymentMethodId: string;
  shiftId?: string;
  referenceNumber?: string;
  refundDate?: Date;
  notes?: string;
}

interface ReturnFilters {
  branchId?: string;
  status?: "draft" | "approved" | "processed";
  startDate?: Date;
  endDate?: Date;
}

// ============================================
// SERVICE
// ============================================

export class ReturnsService {
  /**
   * Generate sequential return number for the year
   */
  private async generateReturnNumber(tenantId: string): Promise<string> {
    const db = getTenantDb(tenantId);
    const currentYear = new Date().getFullYear();

    const result = await db
      .select({ returnNumber: returns.returnNumber })
      .from(returns)
      .where(sql`${returns.returnNumber} LIKE ${"RET" + currentYear + "-%"}`)
      .orderBy(desc(returns.returnNumber))
      .limit(1);

    if (result.length === 0) {
      return `RET${currentYear}-00001`;
    }

    const lastNumber = result[0].returnNumber;
    const match = lastNumber.match(/RET\d{4}-(\d+)/);
    if (!match) {
      return `RET${currentYear}-00001`;
    }

    const nextNumber = (parseInt(match[1], 10) + 1).toString().padStart(5, "0");
    return `RET${currentYear}-${nextNumber}`;
  }

  /**
   * Check if return is within allowed window
   */
  private async checkReturnWindow(
    tenantId: string,
    branchId: string,
    transactionDate: Date,
  ): Promise<void> {
    const db = getTenantDb(tenantId);

    // Get return window from branch settings
    const [settings] = await db
      .select()
      .from(branchSettings)
      .where(eq(branchSettings.branchId, branchId))
      .limit(1);

    const returnWindowDays = settings?.returnWindowDays || 30; // Default 30 days

    const daysSincePurchase = Math.floor(
      (Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSincePurchase > returnWindowDays) {
      throw new Error(
        `Return window expired. This transaction is ${daysSincePurchase} days old, but returns are only allowed within ${returnWindowDays} days.`,
      );
    }
  }

  /**
   * Create a new return (draft status)
   */
  async createReturn(
    tenantId: string,
    data: CreateReturnDto,
    createdBy: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    // Validate that exactly one transaction type is provided
    const transactionCount = [data.saleId, data.laybyId, data.quotationId].filter(
      Boolean,
    ).length;

    if (transactionCount !== 1) {
      throw new Error(
        "Exactly one of saleId, laybyId, or quotationId must be provided",
      );
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new Error("At least one item is required");
    }

    // Get original transaction details and verify return window
    let customerId: string;
    let transactionDate: Date;

    if (data.saleId) {
      const [sale] = await db
        .select()
        .from(sales)
        .where(eq(sales.id, data.saleId))
        .limit(1);

      if (!sale) {
        throw new Error("Sale not found");
      }

      customerId = sale.customerId;
      transactionDate = sale.saleDate;
    } else if (data.laybyId) {
      const [layby] = await db
        .select()
        .from(laybys)
        .where(eq(laybys.id, data.laybyId))
        .limit(1);

      if (!layby) {
        throw new Error("Layby not found");
      }

      customerId = layby.customerId;
      transactionDate = layby.laybyDate;
    } else {
      const [quotation] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, data.quotationId!))
        .limit(1);

      if (!quotation) {
        throw new Error("Quotation not found");
      }

      customerId = quotation.customerId;
      transactionDate = quotation.quotationDate;
    }

    // Check return window
    await this.checkReturnWindow(tenantId, data.branchId, transactionDate);

    // Generate return number
    const returnNumber = await this.generateReturnNumber(tenantId);

    // Calculate total amount and create items
    let totalAmount = 0;
    const itemsToCreate = [];

    for (const item of data.items) {
      // Get product details
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      // Get original line item to get price
      let price = 0;

      if (item.saleItemId) {
        const [saleItem] = await db
          .select()
          .from(saleItems)
          .where(eq(saleItems.id, item.saleItemId))
          .limit(1);

        if (!saleItem) {
          throw new Error("Sale item not found");
        }

        price = saleItem.price;
      } else if (item.laybyItemId) {
        const [laybyItem] = await db
          .select()
          .from(laybyItems)
          .where(eq(laybyItems.id, item.laybyItemId))
          .limit(1);

        if (!laybyItem) {
          throw new Error("Layby item not found");
        }

        price = laybyItem.price;
      } else if (item.quotationItemId) {
        const [quotationItem] = await db
          .select()
          .from(quotationItems)
          .where(eq(quotationItems.id, item.quotationItemId))
          .limit(1);

        if (!quotationItem) {
          throw new Error("Quotation item not found");
        }

        price = quotationItem.price;
      }

      const refundAmount = item.quantity * price;
      totalAmount += refundAmount;

      itemsToCreate.push({
        id: nanoid(),
        returnId: "", // Will be set after return is created
        saleItemId: item.saleItemId,
        laybyItemId: item.laybyItemId,
        quotationItemId: item.quotationItemId,
        productId: item.productId,
        quantity: item.quantity,
        price,
        condition: item.condition,
        conditionNotes: item.conditionNotes,
        refundAmount,
        notes: item.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create return record
    const returnId = nanoid();
    const returnDate = data.returnDate || new Date();

    const [returnRecord] = await db
      .insert(returns)
      .values({
        id: returnId,
        returnNumber,
        branchId: data.branchId,
        saleId: data.saleId,
        laybyId: data.laybyId,
        quotationId: data.quotationId,
        customerId,
        reason: data.reason,
        notes: data.notes,
        totalAmount,
        totalRefunded: 0,
        status: "draft",
        returnDate,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create return items
    for (const item of itemsToCreate) {
      item.returnId = returnId;
    }

    await db.insert(returnItems).values(itemsToCreate);

    return this.getReturnById(tenantId, returnId);
  }

  /**
   * Update a return (draft only)
   */
  async updateReturn(
    tenantId: string,
    returnId: string,
    data: UpdateReturnDto,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const [existingReturn] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnId))
      .limit(1);

    if (!existingReturn) {
      throw new Error("Return not found");
    }

    if (existingReturn.status !== "draft") {
      throw new Error("Only draft returns can be updated");
    }

    // If items are being updated, recalculate total
    let totalAmount = existingReturn.totalAmount;

    if (data.items) {
      await db.delete(returnItems).where(eq(returnItems.returnId, returnId));

      totalAmount = 0;
      const itemsToCreate = [];

      for (const item of data.items) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        // Get price from original line item (same logic as create)
        let price = 0;

        if (item.saleItemId) {
          const [saleItem] = await db
            .select()
            .from(saleItems)
            .where(eq(saleItems.id, item.saleItemId))
            .limit(1);
          if (saleItem) price = saleItem.price;
        } else if (item.laybyItemId) {
          const [laybyItem] = await db
            .select()
            .from(laybyItems)
            .where(eq(laybyItems.id, item.laybyItemId))
            .limit(1);
          if (laybyItem) price = laybyItem.price;
        } else if (item.quotationItemId) {
          const [quotationItem] = await db
            .select()
            .from(quotationItems)
            .where(eq(quotationItems.id, item.quotationItemId))
            .limit(1);
          if (quotationItem) price = quotationItem.price;
        }

        const refundAmount = item.quantity * price;
        totalAmount += refundAmount;

        itemsToCreate.push({
          id: nanoid(),
          returnId,
          saleItemId: item.saleItemId,
          laybyItemId: item.laybyItemId,
          quotationItemId: item.quotationItemId,
          productId: item.productId,
          quantity: item.quantity,
          price,
          condition: item.condition,
          conditionNotes: item.conditionNotes,
          refundAmount,
          notes: item.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await db.insert(returnItems).values(itemsToCreate);
    }

    // Update return record
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.returnDate !== undefined) updateData.returnDate = data.returnDate;
    if (data.items) updateData.totalAmount = totalAmount;

    await db.update(returns).set(updateData).where(eq(returns.id, returnId));

    return this.getReturnById(tenantId, returnId);
  }

  /**
   * Delete a return (draft only)
   */
  async deleteReturn(tenantId: string, returnId: string): Promise<any> {
    const db = getTenantDb(tenantId);

    const [returnRecord] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnId))
      .limit(1);

    if (!returnRecord) {
      throw new Error("Return not found");
    }

    if (returnRecord.status !== "draft") {
      throw new Error("Only draft returns can be deleted");
    }

    await db.delete(returns).where(eq(returns.id, returnId));

    return returnRecord;
  }

  /**
   * Approve a return (requires manager/supervisor)
   */
  async approveReturn(
    tenantId: string,
    returnId: string,
    approvedBy: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const [returnRecord] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnId))
      .limit(1);

    if (!returnRecord) {
      throw new Error("Return not found");
    }

    if (returnRecord.status !== "draft") {
      throw new Error("Only draft returns can be approved");
    }

    await db
      .update(returns)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(returns.id, returnId));

    return this.getReturnById(tenantId, returnId);
  }

  /**
   * Process a return (stock handling and refund processing)
   */
  async processReturn(
    tenantId: string,
    returnId: string,
    processedBy: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const [returnRecord] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnId))
      .limit(1);

    if (!returnRecord) {
      throw new Error("Return not found");
    }

    if (returnRecord.status !== "approved") {
      throw new Error("Only approved returns can be processed");
    }

    // Get return items
    const items = await db
      .select()
      .from(returnItems)
      .where(eq(returnItems.returnId, returnId));

    // Process each item
    for (const item of items) {
      if (item.condition === "good") {
        // Return to inventory
        const [inventory] = await db
          .select()
          .from(branchInventory)
          .where(
            and(
              eq(branchInventory.productId, item.productId),
              eq(branchInventory.branchId, returnRecord.branchId),
            ),
          )
          .limit(1);

        if (!inventory) {
          throw new Error(
            `Inventory not found for product: ${item.productId} at branch: ${returnRecord.branchId}`,
          );
        }

        // Add stock back
        await db
          .update(branchInventory)
          .set({
            quantity: inventory.quantity + item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(branchInventory.id, inventory.id));
      } else {
        // Create inventory loss for damaged item
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        const loss = await inventoryLossesService.createLoss(
          tenantId,
          {
            branchId: returnRecord.branchId,
            lossType: "breakage",
            reason: `Returned damaged item from return ${returnRecord.returnNumber}`,
            referenceNumber: returnRecord.returnNumber,
            notes: item.conditionNotes,
            items: [
              {
                productId: item.productId,
                quantity: item.quantity,
                notes: item.conditionNotes,
              },
            ],
          },
          processedBy,
        );

        // Auto-approve the loss
        await inventoryLossesService.approveLoss(
          tenantId,
          loss.id,
          processedBy,
        );

        // Link the loss to the return item
        await db
          .update(returnItems)
          .set({
            inventoryLossId: loss.id,
            updatedAt: new Date(),
          })
          .where(eq(returnItems.id, item.id));
      }
    }

    // Update return status
    await db
      .update(returns)
      .set({
        status: "processed",
        processedBy,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(returns.id, returnId));

    return this.getReturnById(tenantId, returnId);
  }

  /**
   * Add refund to return
   */
  async addRefund(
    tenantId: string,
    returnId: string,
    data: AddRefundDto,
    createdBy: string,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const [returnRecord] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnId))
      .limit(1);

    if (!returnRecord) {
      throw new Error("Return not found");
    }

    if (returnRecord.status !== "processed") {
      throw new Error("Return must be processed before refunds can be added");
    }

    // Check if refund exceeds remaining amount
    const remaining = returnRecord.totalAmount - returnRecord.totalRefunded;

    if (data.amount > remaining) {
      throw new Error(
        `Refund amount exceeds remaining refund. Remaining: ${remaining}, Requested: ${data.amount}`,
      );
    }

    // Get currency exchange rate
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, data.currencyId))
      .limit(1);

    if (!currency) {
      throw new Error("Currency not found");
    }

    const exchangeRate = currency.exchangeRate;
    const amountInBaseCurrency = data.amount * exchangeRate;

    // If shift is provided, verify it's open
    if (data.shiftId) {
      const [shift] = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, data.shiftId))
        .limit(1);

      if (!shift) {
        throw new Error("Shift not found");
      }

      if (shift.status !== "open") {
        throw new Error("Shift must be open to process cash refunds");
      }
    }

    // Create refund
    const refundDate = data.refundDate || new Date();

    const [refund] = await db
      .insert(returnRefunds)
      .values({
        id: nanoid(),
        returnId,
        amount: data.amount,
        currencyId: data.currencyId,
        paymentMethodId: data.paymentMethodId,
        exchangeRate,
        amountInBaseCurrency,
        shiftId: data.shiftId,
        referenceNumber: data.referenceNumber,
        refundDate,
        notes: data.notes,
        createdBy,
        createdAt: new Date(),
      })
      .returning();

    // Update return total refunded
    await db
      .update(returns)
      .set({
        totalRefunded: returnRecord.totalRefunded + amountInBaseCurrency,
        updatedAt: new Date(),
      })
      .where(eq(returns.id, returnId));

    return refund;
  }

  /**
   * Get return by ID with items and refunds
   */
  async getReturnById(tenantId: string, returnId: string): Promise<any> {
    const db = getTenantDb(tenantId);

    const [returnRecord] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnId))
      .limit(1);

    if (!returnRecord) {
      throw new Error("Return not found");
    }

    // Get items with product details
    const items = await db
      .select({
        id: returnItems.id,
        returnId: returnItems.returnId,
        saleItemId: returnItems.saleItemId,
        laybyItemId: returnItems.laybyItemId,
        quotationItemId: returnItems.quotationItemId,
        productId: returnItems.productId,
        productName: products.name,
        productSku: products.sku,
        quantity: returnItems.quantity,
        price: returnItems.price,
        condition: returnItems.condition,
        conditionNotes: returnItems.conditionNotes,
        inventoryLossId: returnItems.inventoryLossId,
        refundAmount: returnItems.refundAmount,
        notes: returnItems.notes,
        createdAt: returnItems.createdAt,
        updatedAt: returnItems.updatedAt,
      })
      .from(returnItems)
      .leftJoin(products, eq(returnItems.productId, products.id))
      .where(eq(returnItems.returnId, returnId));

    // Get refunds
    const refunds = await db
      .select()
      .from(returnRefunds)
      .where(eq(returnRefunds.returnId, returnId));

    return {
      ...returnRecord,
      items,
      refunds,
    };
  }

  /**
   * Get returns with filters
   */
  async getReturns(
    tenantId: string,
    filters: ReturnFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any[]> {
    const db = getTenantDb(tenantId);

    const conditions = [];

    if (filters.branchId) {
      conditions.push(eq(returns.branchId, filters.branchId));
    }

    if (filters.status) {
      conditions.push(eq(returns.status, filters.status));
    }

    if (filters.startDate) {
      conditions.push(
        gte(returns.returnDate, Math.floor(filters.startDate.getTime() / 1000)),
      );
    }

    if (filters.endDate) {
      conditions.push(
        lte(returns.returnDate, Math.floor(filters.endDate.getTime() / 1000)),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const returnRecords = await db
      .select()
      .from(returns)
      .where(whereClause)
      .orderBy(desc(returns.returnDate))
      .limit(limit)
      .offset(offset);

    return returnRecords;
  }

  /**
   * Get return report
   */
  async getReturnReport(
    tenantId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // Get processed returns in date range
    const returnRecords = await db
      .select()
      .from(returns)
      .where(
        and(
          eq(returns.branchId, branchId),
          eq(returns.status, "processed"),
          gte(returns.returnDate, startTimestamp),
          lte(returns.returnDate, endTimestamp),
        ),
      );

    let totalReturns = 0;
    let totalValue = 0;
    let totalRefunded = 0;
    let goodItems = 0;
    let damagedItems = 0;

    for (const returnRecord of returnRecords) {
      totalReturns++;
      totalValue += returnRecord.totalAmount;
      totalRefunded += returnRecord.totalRefunded;

      // Count item conditions
      const items = await db
        .select()
        .from(returnItems)
        .where(eq(returnItems.returnId, returnRecord.id));

      for (const item of items) {
        if (item.condition === "good") {
          goodItems++;
        } else {
          damagedItems++;
        }
      }
    }

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalReturns,
        totalValue,
        totalRefunded,
        totalPending: totalValue - totalRefunded,
      },
      itemConditions: {
        good: goodItems,
        damaged: damagedItems,
      },
    };
  }
}
