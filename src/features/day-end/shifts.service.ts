import { and, eq, isNull, sql } from "drizzle-orm";
import { getTenantDb } from "@/db/connection";
import {
  shifts,
  tills,
  cashMovements,
  payments,
  paymentMethods,
  currencies,
  dayEnds,
  dayEndShifts,
} from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";

interface OpenShiftDto {
  tillId: string;
  openingBalance?: number;
}

interface CloseShiftDto {
  closingBalance: number;
}

interface AddCashMovementDto {
  type: "cash_in" | "cash_out" | "bank_deposit" | "petty_cash";
  amount: number;
  currencyId: string;
  reason: string;
  notes?: string;
}

export class ShiftsService {
  /**
   * Open a new shift
   */
  async openShift(
    tenantId: string,
    cashierId: string,
    dto: OpenShiftDto,
  ): Promise<typeof shifts.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Verify till exists and is active
    const [till] = await db
      .select()
      .from(tills)
      .where(and(eq(tills.id, dto.tillId), eq(tills.isActive, true)))
      .limit(1);

    if (!till) {
      throw new Error("Till not found or inactive");
    }

    // Check if cashier already has an open shift
    const [openShift] = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.cashierId, cashierId), eq(shifts.status, "open")))
      .limit(1);

    if (openShift) {
      throw new Error(
        "Cashier already has an open shift. Please close it first.",
      );
    }

    const [shift] = await db
      .insert(shifts)
      .values({
        id: nanoid(),
        tillId: dto.tillId,
        branchId: till.branchId,
        cashierId,
        openingBalance: dto.openingBalance || 0,
        status: "open",
      })
      .returning();

    return shift;
  }

  /**
   * Get current open shift for a cashier
   */
  async getCurrentShift(
    tenantId: string,
    cashierId: string,
  ): Promise<typeof shifts.$inferSelect | null> {
    const db = getTenantDb(tenantId);

    const [shift] = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.cashierId, cashierId), eq(shifts.status, "open")))
      .limit(1);

    return shift || null;
  }

  /**
   * Add cash movement (requires approval)
   */
  async addCashMovement(
    tenantId: string,
    shiftId: string,
    dto: AddCashMovementDto,
    createdBy: string,
  ): Promise<typeof cashMovements.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Verify shift exists and is open
    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);

    if (!shift) {
      throw new Error("Shift not found");
    }

    if (shift.status !== "open") {
      throw new Error("Cannot add cash movement to a closed shift");
    }

    // Verify currency exists
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, dto.currencyId))
      .limit(1);

    if (!currency) {
      throw new Error("Currency not found");
    }

    const [movement] = await db
      .insert(cashMovements)
      .values({
        id: nanoid(),
        shiftId,
        type: dto.type,
        amount: dto.amount,
        currencyId: dto.currencyId,
        reason: dto.reason,
        notes: dto.notes,
        createdBy,
      })
      .returning();

    return movement;
  }

  /**
   * Approve cash movement (Manager/Supervisor only)
   */
  async approveCashMovement(
    tenantId: string,
    movementId: string,
    approvedBy: string,
  ): Promise<typeof cashMovements.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Get existing movement
    const [movement] = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.id, movementId))
      .limit(1);

    if (!movement) {
      throw new Error("Cash movement not found");
    }

    if (movement.approvedBy) {
      throw new Error("Cash movement already approved");
    }

    const [approved] = await db
      .update(cashMovements)
      .set({
        approvedBy,
        approvedAt: new Date(),
      })
      .where(eq(cashMovements.id, movementId))
      .returning();

    return approved;
  }

  /**
   * Get all cash movements for a shift
   */
  async getCashMovementsByShift(
    tenantId: string,
    shiftId: string,
  ): Promise<(typeof cashMovements.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.shiftId, shiftId))
      .orderBy(cashMovements.createdAt);
  }

  /**
   * Get pending (unapproved) cash movements for a shift
   */
  async getPendingCashMovements(
    tenantId: string,
    shiftId: string,
  ): Promise<(typeof cashMovements.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(cashMovements)
      .where(
        and(eq(cashMovements.shiftId, shiftId), isNull(cashMovements.approvedBy)),
      )
      .orderBy(cashMovements.createdAt);
  }

  /**
   * Calculate expected cash for a shift
   */
  private async calculateExpectedCash(
    tenantId: string,
    shiftId: string,
  ): Promise<number> {
    const db = getTenantDb(tenantId);

    // Get shift details
    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);

    if (!shift) {
      throw new Error("Shift not found");
    }

    // Get default/cash payment method
    const [cashPaymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.name, "Cash"))
      .limit(1);

    if (!cashPaymentMethod) {
      throw new Error(
        "Cash payment method not found. Please configure payment methods.",
      );
    }

    // Get base currency
    const [baseCurrency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.isDefault, true))
      .limit(1);

    if (!baseCurrency) {
      throw new Error("Base currency not found");
    }

    // Get all cash payments for this shift (in base currency)
    const cashPayments = await db
      .select({
        amountInBaseCurrency: payments.amountInBaseCurrency,
      })
      .from(payments)
      .where(
        and(
          eq(payments.shiftId, shiftId),
          eq(payments.paymentMethodId, cashPaymentMethod.id),
        ),
      );

    const totalCashSales = cashPayments.reduce(
      (sum, p) => sum + (p.amountInBaseCurrency || 0),
      0,
    );

    // Get approved cash movements
    const movements = await db
      .select()
      .from(cashMovements)
      .where(and(eq(cashMovements.shiftId, shiftId), isNull(cashMovements.approvedBy).not()));

    let totalCashIn = 0;
    let totalCashOut = 0;
    let totalBankDeposits = 0;

    for (const movement of movements) {
      // Convert to base currency
      const [currency] = await db
        .select()
        .from(currencies)
        .where(eq(currencies.id, movement.currencyId))
        .limit(1);

      const amountInBase = movement.amount * (currency?.exchangeRate || 1);

      if (movement.type === "cash_in") {
        totalCashIn += amountInBase;
      } else if (
        movement.type === "cash_out" ||
        movement.type === "petty_cash"
      ) {
        totalCashOut += amountInBase;
      } else if (movement.type === "bank_deposit") {
        totalBankDeposits += amountInBase;
      }
    }

    // Expected cash = opening + cash sales + cash in - cash out - bank deposits
    const expectedCash =
      shift.openingBalance +
      totalCashSales +
      totalCashIn -
      totalCashOut -
      totalBankDeposits;

    return expectedCash;
  }

  /**
   * Close shift and calculate variance
   */
  async closeShift(
    tenantId: string,
    shiftId: string,
    dto: CloseShiftDto,
  ): Promise<typeof shifts.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Get shift
    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);

    if (!shift) {
      throw new Error("Shift not found");
    }

    if (shift.status === "closed") {
      throw new Error("Shift is already closed");
    }

    // Check for pending cash movements
    const pending = await this.getPendingCashMovements(tenantId, shiftId);
    if (pending.length > 0) {
      throw new Error(
        `Cannot close shift. ${pending.length} cash movement(s) pending approval.`,
      );
    }

    // Calculate expected cash
    const expectedCash = await this.calculateExpectedCash(tenantId, shiftId);
    const variance = dto.closingBalance - expectedCash;

    // Close the shift
    const [closedShift] = await db
      .update(shifts)
      .set({
        closingBalance: dto.closingBalance,
        expectedCash,
        actualCash: dto.closingBalance,
        variance,
        status: "closed",
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shifts.id, shiftId))
      .returning();

    // Trigger day end creation/update
    await this.createOrUpdateDayEnd(tenantId, closedShift);

    return closedShift;
  }

  /**
   * Create or update day end when a shift closes
   */
  private async createOrUpdateDayEnd(
    tenantId: string,
    shift: typeof shifts.$inferSelect,
  ): Promise<void> {
    const db = getTenantDb(tenantId);

    // Get business date (start of day) from shift close time
    const businessDate = new Date(shift.closedAt!);
    businessDate.setHours(0, 0, 0, 0);

    // Check if day end already exists for this branch and date
    const [existingDayEnd] = await db
      .select()
      .from(dayEnds)
      .where(
        and(
          eq(dayEnds.branchId, shift.branchId),
          eq(dayEnds.businessDate, businessDate),
        ),
      )
      .limit(1);

    if (existingDayEnd) {
      // Add shift to existing day end
      await db.insert(dayEndShifts).values({
        id: nanoid(),
        dayEndId: existingDayEnd.id,
        shiftId: shift.id,
      });

      // Recalculate totals
      await this.recalculateDayEndTotals(tenantId, existingDayEnd.id);
    } else {
      // Create new day end
      const [dayEnd] = await db
        .insert(dayEnds)
        .values({
          id: nanoid(),
          branchId: shift.branchId,
          businessDate,
          status: "draft",
          createdBy: shift.cashierId,
        })
        .returning();

      // Add shift to day end
      await db.insert(dayEndShifts).values({
        id: nanoid(),
        dayEndId: dayEnd.id,
        shiftId: shift.id,
      });

      // Calculate totals
      await this.recalculateDayEndTotals(tenantId, dayEnd.id);
    }
  }

  /**
   * Recalculate day end totals
   */
  private async recalculateDayEndTotals(
    tenantId: string,
    dayEndId: string,
  ): Promise<void> {
    const db = getTenantDb(tenantId);

    // Get all shifts for this day end
    const dayEndShiftRecords = await db
      .select({
        shiftId: dayEndShifts.shiftId,
      })
      .from(dayEndShifts)
      .where(eq(dayEndShifts.dayEndId, dayEndId));

    const shiftIds = dayEndShiftRecords.map((r) => r.shiftId);

    if (shiftIds.length === 0) {
      return;
    }

    // Get all shifts
    const allShifts = await db
      .select()
      .from(shifts)
      .where(
        sql`${shifts.id} IN ${sql.raw(`(${shiftIds.map(() => "?").join(", ")})`)}`,
      );

    // Calculate totals
    const totalVariance = allShifts.reduce(
      (sum, s) => sum + (s.variance || 0),
      0,
    );

    // Get total sales (from payments in these shifts)
    const totalSalesResult = await db
      .select({
        total: sql<number>`SUM(${payments.amountInBaseCurrency})`,
      })
      .from(payments)
      .where(
        sql`${payments.shiftId} IN ${sql.raw(`(${shiftIds.map(() => "?").join(", ")})`)}`,
      );

    const totalSales = totalSalesResult[0]?.total || 0;

    // Get total cash (from cash payments in these shifts)
    const [cashPaymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.name, "Cash"))
      .limit(1);

    const totalCashResult = await db
      .select({
        total: sql<number>`SUM(${payments.amountInBaseCurrency})`,
      })
      .from(payments)
      .where(
        and(
          sql`${payments.shiftId} IN ${sql.raw(`(${shiftIds.map(() => "?").join(", ")})`)}`,
          eq(payments.paymentMethodId, cashPaymentMethod?.id || ""),
        ),
      );

    const totalCash = totalCashResult[0]?.total || 0;

    // Update day end
    await db
      .update(dayEnds)
      .set({
        totalSales,
        totalCash,
        totalVariance,
        updatedAt: new Date(),
      })
      .where(eq(dayEnds.id, dayEndId));
  }

  /**
   * Get shift by ID with details
   */
  async getShiftById(
    tenantId: string,
    shiftId: string,
  ): Promise<typeof shifts.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);

    if (!shift) {
      throw new Error("Shift not found");
    }

    return shift;
  }

  /**
   * Get all shifts for a branch
   */
  async getShiftsByBranch(
    tenantId: string,
    branchId: string,
    limit: number = 50,
  ): Promise<(typeof shifts.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(shifts)
      .where(eq(shifts.branchId, branchId))
      .orderBy(sql`${shifts.openedAt} DESC`)
      .limit(limit);
  }

  /**
   * Get all shifts for a cashier
   */
  async getShiftsByCashier(
    tenantId: string,
    cashierId: string,
    limit: number = 50,
  ): Promise<(typeof shifts.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(shifts)
      .where(eq(shifts.cashierId, cashierId))
      .orderBy(sql`${shifts.openedAt} DESC`)
      .limit(limit);
  }
}
