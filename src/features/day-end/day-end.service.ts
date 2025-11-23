import { and, between, eq, sql } from "drizzle-orm";
import { getTenantDb } from "@/db/connection";
import {
  dayEnds,
  dayEndShifts,
  dayEndPayments,
  shifts,
  payments,
  paymentMethods,
  currencies,
  sales,
  saleItems,
  products,
  productCategories,
} from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";

interface DayEndSummary {
  dayEnd: typeof dayEnds.$inferSelect;
  shifts: (typeof shifts.$inferSelect)[];
  paymentReconciliation: PaymentReconciliation[];
  salesSummary: SalesSummary;
}

interface PaymentReconciliation {
  paymentMethod: string;
  currency: string;
  expectedAmount: number;
  actualAmount: number;
  variance: number;
  transactionCount: number;
}

interface SalesSummary {
  totalSales: number;
  salesByType: {
    credit: number;
    till: number;
  };
  salesByCashier: {
    cashierId: string;
    cashierName: string;
    totalSales: number;
    transactionCount: number;
  }[];
  salesByCategory: {
    categoryId: string;
    categoryName: string;
    totalSales: number;
    quantity: number;
  }[];
  discountsGiven: number;
  taxCollected: number;
}

interface UpdatePaymentReconciliationDto {
  paymentMethodId: string;
  currencyId: string;
  actualAmount: number;
}

export class DayEndService {
  /**
   * Get day end by ID with full details
   */
  async getDayEndById(
    tenantId: string,
    dayEndId: string,
  ): Promise<DayEndSummary> {
    const db = getTenantDb(tenantId);

    const [dayEnd] = await db
      .select()
      .from(dayEnds)
      .where(eq(dayEnds.id, dayEndId))
      .limit(1);

    if (!dayEnd) {
      throw new Error("Day end not found");
    }

    // Get all shifts for this day end
    const dayEndShiftRecords = await db
      .select()
      .from(dayEndShifts)
      .where(eq(dayEndShifts.dayEndId, dayEndId));

    const shiftIds = dayEndShiftRecords.map((r) => r.shiftId);

    const allShifts =
      shiftIds.length > 0
        ? await db
            .select()
            .from(shifts)
            .where(
              sql`${shifts.id} IN ${sql.raw(`(${shiftIds.map(() => "?").join(", ")})`)}`,
            )
        : [];

    // Get payment reconciliation
    const paymentReconciliation =
      await this.getPaymentReconciliation(tenantId, dayEndId, shiftIds);

    // Get sales summary
    const salesSummary = await this.getSalesSummary(tenantId, dayEndId, shiftIds);

    return {
      dayEnd,
      shifts: allShifts,
      paymentReconciliation,
      salesSummary,
    };
  }

  /**
   * Get payment reconciliation for a day end
   */
  private async getPaymentReconciliation(
    tenantId: string,
    dayEndId: string,
    shiftIds: string[],
  ): Promise<PaymentReconciliation[]> {
    const db = getTenantDb(tenantId);

    if (shiftIds.length === 0) {
      return [];
    }

    // Get all payments for these shifts
    const allPayments = await db
      .select({
        paymentMethodId: payments.paymentMethodId,
        currencyId: payments.currencyId,
        amountInBaseCurrency: payments.amountInBaseCurrency,
      })
      .from(payments)
      .where(
        sql`${payments.shiftId} IN ${sql.raw(`(${shiftIds.map(() => "?").join(", ")})`)}`,
      );

    // Group by payment method and currency
    const grouped = new Map<
      string,
      {
        paymentMethodId: string;
        currencyId: string;
        expectedAmount: number;
        count: number;
      }
    >();

    for (const payment of allPayments) {
      const key = `${payment.paymentMethodId}-${payment.currencyId}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.expectedAmount += payment.amountInBaseCurrency || 0;
        existing.count++;
      } else {
        grouped.set(key, {
          paymentMethodId: payment.paymentMethodId!,
          currencyId: payment.currencyId,
          expectedAmount: payment.amountInBaseCurrency || 0,
          count: 1,
        });
      }
    }

    // Get actual amounts from day_end_payments
    const dayEndPaymentRecords = await db
      .select()
      .from(dayEndPayments)
      .where(eq(dayEndPayments.dayEndId, dayEndId));

    // Build reconciliation array
    const reconciliation: PaymentReconciliation[] = [];

    for (const [, group] of grouped) {
      // Get payment method and currency names
      const [paymentMethod] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, group.paymentMethodId))
        .limit(1);

      const [currency] = await db
        .select()
        .from(currencies)
        .where(eq(currencies.id, group.currencyId))
        .limit(1);

      // Find actual amount
      const actual = dayEndPaymentRecords.find(
        (r) =>
          r.paymentMethodId === group.paymentMethodId &&
          r.currencyId === group.currencyId,
      );

      reconciliation.push({
        paymentMethod: paymentMethod?.name || "Unknown",
        currency: currency?.name || "Unknown",
        expectedAmount: group.expectedAmount,
        actualAmount: actual?.actualAmount || group.expectedAmount,
        variance: (actual?.actualAmount || group.expectedAmount) - group.expectedAmount,
        transactionCount: group.count,
      });
    }

    return reconciliation;
  }

  /**
   * Get sales summary for a day end
   */
  private async getSalesSummary(
    tenantId: string,
    dayEndId: string,
    shiftIds: string[],
  ): Promise<SalesSummary> {
    const db = getTenantDb(tenantId);

    if (shiftIds.length === 0) {
      return {
        totalSales: 0,
        salesByType: { credit: 0, till: 0 },
        salesByCashier: [],
        salesByCategory: [],
        discountsGiven: 0,
        taxCollected: 0,
      };
    }

    // Get all payments for these shifts to find related sales
    const allPayments = await db
      .select({
        saleId: payments.saleId,
        amountInBaseCurrency: payments.amountInBaseCurrency,
      })
      .from(payments)
      .where(
        sql`${payments.shiftId} IN ${sql.raw(`(${shiftIds.map(() => "?").join(", ")})`)}`,
      );

    const saleIds = [
      ...new Set(allPayments.map((p) => p.saleId).filter((id) => id !== null)),
    ] as string[];

    if (saleIds.length === 0) {
      return {
        totalSales: 0,
        salesByType: { credit: 0, till: 0 },
        salesByCashier: [],
        salesByCategory: [],
        discountsGiven: 0,
        taxCollected: 0,
      };
    }

    // Get all sales
    const allSales = await db
      .select()
      .from(sales)
      .where(
        sql`${sales.id} IN ${sql.raw(`(${saleIds.map(() => "?").join(", ")})`)}`,
      );

    // Total sales
    const totalSales = allSales.reduce((sum, s) => sum + s.total, 0);

    // Sales by type
    const salesByType = {
      credit: allSales
        .filter((s) => s.saleType === "credit")
        .reduce((sum, s) => sum + s.total, 0),
      till: allSales
        .filter((s) => s.saleType === "till")
        .reduce((sum, s) => sum + s.total, 0),
    };

    // Sales by cashier (from shift cashiers)
    const allShifts = await db
      .select()
      .from(shifts)
      .where(
        sql`${shifts.id} IN ${sql.raw(`(${shiftIds.map(() => "?").join(", ")})`)}`,
      );

    const salesByCashier: SalesSummary["salesByCashier"] = [];
    for (const shift of allShifts) {
      // Get payments in this shift
      const shiftPayments = await db
        .select({
          saleId: payments.saleId,
          amountInBaseCurrency: payments.amountInBaseCurrency,
        })
        .from(payments)
        .where(eq(payments.shiftId, shift.id));

      const cashierSaleIds = [
        ...new Set(shiftPayments.map((p) => p.saleId).filter((id) => id !== null)),
      ] as string[];

      if (cashierSaleIds.length === 0) continue;

      const cashierSales = allSales.filter((s) =>
        cashierSaleIds.includes(s.id),
      );
      const cashierTotal = cashierSales.reduce((sum, s) => sum + s.total, 0);

      salesByCashier.push({
        cashierId: shift.cashierId,
        cashierName: "Cashier", // TODO: Get from users table
        totalSales: cashierTotal,
        transactionCount: cashierSales.length,
      });
    }

    // Sales by category
    const allSaleItems = await db
      .select()
      .from(saleItems)
      .where(
        sql`${saleItems.saleId} IN ${sql.raw(`(${saleIds.map(() => "?").join(", ")})`)}`,
      );

    const categoryMap = new Map<
      string,
      { categoryId: string; categoryName: string; total: number; quantity: number }
    >();

    for (const item of allSaleItems) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product || !product.categoryId) continue;

      const [category] = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, product.categoryId))
        .limit(1);

      const existing = categoryMap.get(product.categoryId);
      if (existing) {
        existing.total += item.lineTotal;
        existing.quantity += item.quantity;
      } else {
        categoryMap.set(product.categoryId, {
          categoryId: product.categoryId,
          categoryName: category?.name || "Unknown",
          total: item.lineTotal,
          quantity: item.quantity,
        });
      }
    }

    const salesByCategory = Array.from(categoryMap.values()).map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      totalSales: c.total,
      quantity: c.quantity,
    }));

    // Discounts given
    const discountsGiven = allSales.reduce(
      (sum, s) => sum + (s.discountAmount || 0),
      0,
    );

    // Tax collected
    const taxCollected = allSales.reduce((sum, s) => sum + s.taxAmount, 0);

    return {
      totalSales,
      salesByType,
      salesByCashier,
      salesByCategory,
      discountsGiven,
      taxCollected,
    };
  }

  /**
   * Get day ends for a branch
   */
  async getDayEndsByBranch(
    tenantId: string,
    branchId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<(typeof dayEnds.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    if (startDate && endDate) {
      return await db
        .select()
        .from(dayEnds)
        .where(
          and(
            eq(dayEnds.branchId, branchId),
            between(dayEnds.businessDate, startDate, endDate),
          ),
        )
        .orderBy(sql`${dayEnds.businessDate} DESC`);
    }

    return await db
      .select()
      .from(dayEnds)
      .where(eq(dayEnds.branchId, branchId))
      .orderBy(sql`${dayEnds.businessDate} DESC`)
      .limit(30);
  }

  /**
   * Update payment reconciliation (during review)
   */
  async updatePaymentReconciliation(
    tenantId: string,
    dayEndId: string,
    reconciliations: UpdatePaymentReconciliationDto[],
  ): Promise<void> {
    const db = getTenantDb(tenantId);

    // Verify day end exists and is not approved
    const [dayEnd] = await db
      .select()
      .from(dayEnds)
      .where(eq(dayEnds.id, dayEndId))
      .limit(1);

    if (!dayEnd) {
      throw new Error("Day end not found");
    }

    if (dayEnd.status === "approved") {
      // Check if within edit window
      if (dayEnd.canEditUntil && new Date() > dayEnd.canEditUntil) {
        throw new Error("Day end edit window has expired (24 hours passed)");
      }
    }

    // Delete existing reconciliation records
    await db.delete(dayEndPayments).where(eq(dayEndPayments.dayEndId, dayEndId));

    // Insert new reconciliation records
    for (const rec of reconciliations) {
      // Get expected amount from payments
      const dayEndShiftRecords = await db
        .select()
        .from(dayEndShifts)
        .where(eq(dayEndShifts.dayEndId, dayEndId));

      const shiftIds = dayEndShiftRecords.map((r) => r.shiftId);

      const expectedResult = await db
        .select({
          total: sql<number>`SUM(${payments.amountInBaseCurrency})`,
        })
        .from(payments)
        .where(
          and(
            sql`${payments.shiftId} IN ${sql.raw(`(${shiftIds.map(() => "?").join(", ")})`)}`,
            eq(payments.paymentMethodId, rec.paymentMethodId),
            eq(payments.currencyId, rec.currencyId),
          ),
        );

      const expectedAmount = expectedResult[0]?.total || 0;
      const variance = rec.actualAmount - expectedAmount;

      await db.insert(dayEndPayments).values({
        id: nanoid(),
        dayEndId,
        paymentMethodId: rec.paymentMethodId,
        currencyId: rec.currencyId,
        expectedAmount,
        actualAmount: rec.actualAmount,
        variance,
      });
    }
  }

  /**
   * Review day end (Manager/Supervisor)
   */
  async reviewDayEnd(
    tenantId: string,
    dayEndId: string,
    reviewedBy: string,
  ): Promise<typeof dayEnds.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [dayEnd] = await db
      .select()
      .from(dayEnds)
      .where(eq(dayEnds.id, dayEndId))
      .limit(1);

    if (!dayEnd) {
      throw new Error("Day end not found");
    }

    if (dayEnd.status !== "draft") {
      throw new Error("Only draft day ends can be reviewed");
    }

    const [reviewed] = await db
      .update(dayEnds)
      .set({
        status: "reviewed",
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dayEnds.id, dayEndId))
      .returning();

    return reviewed;
  }

  /**
   * Approve day end (Manager only)
   */
  async approveDayEnd(
    tenantId: string,
    dayEndId: string,
    approvedBy: string,
  ): Promise<typeof dayEnds.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [dayEnd] = await db
      .select()
      .from(dayEnds)
      .where(eq(dayEnds.id, dayEndId))
      .limit(1);

    if (!dayEnd) {
      throw new Error("Day end not found");
    }

    if (dayEnd.status !== "reviewed") {
      throw new Error("Day end must be reviewed before approval");
    }

    const now = new Date();
    const canEditUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const [approved] = await db
      .update(dayEnds)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: now,
        closedAt: now,
        canEditUntil,
        updatedAt: now,
      })
      .where(eq(dayEnds.id, dayEndId))
      .returning();

    return approved;
  }

  /**
   * Reopen day end (only within 24 hours of approval)
   */
  async reopenDayEnd(
    tenantId: string,
    dayEndId: string,
    reopenedBy: string,
  ): Promise<typeof dayEnds.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [dayEnd] = await db
      .select()
      .from(dayEnds)
      .where(eq(dayEnds.id, dayEndId))
      .limit(1);

    if (!dayEnd) {
      throw new Error("Day end not found");
    }

    if (dayEnd.status !== "approved") {
      throw new Error("Only approved day ends can be reopened");
    }

    // Check if within 24-hour window
    if (!dayEnd.canEditUntil || new Date() > dayEnd.canEditUntil) {
      throw new Error(
        "Cannot reopen day end. 24-hour edit window has expired.",
      );
    }

    const [reopened] = await db
      .update(dayEnds)
      .set({
        status: "reopened",
        updatedAt: new Date(),
      })
      .where(eq(dayEnds.id, dayEndId))
      .returning();

    return reopened;
  }
}
