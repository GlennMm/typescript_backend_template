import { and, between, eq, gte, lte, or, sql } from "drizzle-orm";
import { getTenantDb } from "@/db/connection";
import {
  branches,
  expenseCategories,
  expenses,
  expensePayments,
  currencies,
  paymentMethods,
} from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";

interface CreateExpenseDto {
  branchId: string;
  categoryId: string;
  vendor: string;
  description: string;
  amount: number;
  currencyId: string;
  expenseDate?: Date;
  dueDate?: Date;
  isTaxDeductible?: boolean;
  isRecurring?: boolean;
  recurringFrequency?: "monthly" | "quarterly" | "yearly";
  recurringEndDate?: Date;
  notes?: string;
}

interface UpdateExpenseDto {
  categoryId?: string;
  vendor?: string;
  description?: string;
  amount?: number;
  currencyId?: string;
  expenseDate?: Date;
  dueDate?: Date;
  isTaxDeductible?: boolean;
  notes?: string;
}

interface AddPaymentDto {
  amount: number;
  currencyId: string;
  paymentMethodId: string;
  paymentDate?: Date;
  referenceNumber?: string;
  notes?: string;
}

interface ExpenseFilters {
  branchId?: string;
  categoryId?: string;
  status?: "draft" | "submitted" | "approved" | "rejected" | "paid";
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  isTaxDeductible?: boolean;
}

export class ExpensesService {
  /**
   * Generate expense number (EXP2025-00001)
   */
  private async generateExpenseNumber(tenantId: string): Promise<string> {
    const db = getTenantDb(tenantId);
    const year = new Date().getFullYear();
    const prefix = `EXP${year}-`;

    // Get the latest expense number for this year
    const latestExpenses = await db
      .select()
      .from(expenses)
      .where(sql`${expenses.expenseNumber} LIKE ${prefix + "%"}`)
      .orderBy(sql`${expenses.expenseNumber} DESC`)
      .limit(1);

    let nextNumber = 1;

    if (latestExpenses.length > 0) {
      const latestNumber = latestExpenses[0].expenseNumber.split("-")[1];
      nextNumber = parseInt(latestNumber, 10) + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
  }

  /**
   * Create a new expense (draft status)
   */
  async createExpense(
    tenantId: string,
    dto: CreateExpenseDto,
    createdBy: string,
  ): Promise<typeof expenses.$inferSelect> {
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

    // Verify category exists and belongs to branch
    const [category] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.id, dto.categoryId))
      .limit(1);

    if (!category) {
      throw new Error("Category not found");
    }

    if (category.branchId !== dto.branchId) {
      throw new Error("Category does not belong to this branch");
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

    // Validate recurring fields
    if (dto.isRecurring && !dto.recurringFrequency) {
      throw new Error("Recurring frequency is required for recurring expenses");
    }

    const expenseNumber = await this.generateExpenseNumber(tenantId);
    const amountInBaseCurrency = dto.amount * currency.exchangeRate;

    const [expense] = await db
      .insert(expenses)
      .values({
        id: nanoid(),
        expenseNumber,
        branchId: dto.branchId,
        categoryId: dto.categoryId,
        vendor: dto.vendor,
        description: dto.description,
        amount: dto.amount,
        currencyId: dto.currencyId,
        exchangeRate: currency.exchangeRate,
        amountInBaseCurrency,
        expenseDate: dto.expenseDate || new Date(),
        dueDate: dto.dueDate,
        isTaxDeductible: dto.isTaxDeductible || false,
        isRecurring: dto.isRecurring || false,
        recurringFrequency: dto.recurringFrequency,
        recurringEndDate: dto.recurringEndDate,
        amountDue: amountInBaseCurrency,
        notes: dto.notes,
        createdBy,
      })
      .returning();

    return expense;
  }

  /**
   * Update expense (draft only)
   */
  async updateExpense(
    tenantId: string,
    expenseId: string,
    dto: UpdateExpenseDto,
  ): Promise<typeof expenses.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Get existing expense
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!existing) {
      throw new Error("Expense not found");
    }

    if (existing.status !== "draft") {
      throw new Error("Only draft expenses can be updated");
    }

    // If updating category, verify it belongs to same branch
    if (dto.categoryId) {
      const [category] = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, dto.categoryId))
        .limit(1);

      if (!category) {
        throw new Error("Category not found");
      }

      if (category.branchId !== existing.branchId) {
        throw new Error("Category does not belong to the same branch");
      }
    }

    // If updating currency or amount, recalculate amountInBaseCurrency
    let amountInBaseCurrency = existing.amountInBaseCurrency;

    if (dto.currencyId || dto.amount) {
      const newAmount = dto.amount ?? existing.amount;
      const newCurrencyId = dto.currencyId ?? existing.currencyId;

      const [currency] = await db
        .select()
        .from(currencies)
        .where(eq(currencies.id, newCurrencyId))
        .limit(1);

      if (!currency) {
        throw new Error("Currency not found");
      }

      amountInBaseCurrency = newAmount * currency.exchangeRate;
    }

    const [updated] = await db
      .update(expenses)
      .set({
        ...dto,
        amountInBaseCurrency,
        amountDue: amountInBaseCurrency - existing.amountPaid,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    return updated;
  }

  /**
   * Delete expense (draft only)
   */
  async deleteExpense(
    tenantId: string,
    expenseId: string,
  ): Promise<typeof expenses.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!existing) {
      throw new Error("Expense not found");
    }

    if (existing.status !== "draft") {
      throw new Error("Only draft expenses can be deleted");
    }

    const [deleted] = await db
      .delete(expenses)
      .where(eq(expenses.id, expenseId))
      .returning();

    return deleted;
  }

  /**
   * Submit expense for approval
   */
  async submitExpense(
    tenantId: string,
    expenseId: string,
    submittedBy: string,
  ): Promise<typeof expenses.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!existing) {
      throw new Error("Expense not found");
    }

    if (existing.status !== "draft") {
      throw new Error("Only draft expenses can be submitted");
    }

    const [updated] = await db
      .update(expenses)
      .set({
        status: "submitted",
        submittedBy,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    return updated;
  }

  /**
   * Approve expense
   */
  async approveExpense(
    tenantId: string,
    expenseId: string,
    approvedBy: string,
  ): Promise<typeof expenses.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!existing) {
      throw new Error("Expense not found");
    }

    if (existing.status !== "submitted") {
      throw new Error("Only submitted expenses can be approved");
    }

    const [updated] = await db
      .update(expenses)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    return updated;
  }

  /**
   * Reject expense
   */
  async rejectExpense(
    tenantId: string,
    expenseId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<typeof expenses.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!existing) {
      throw new Error("Expense not found");
    }

    if (existing.status !== "submitted") {
      throw new Error("Only submitted expenses can be rejected");
    }

    const [updated] = await db
      .update(expenses)
      .set({
        status: "rejected",
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    return updated;
  }

  /**
   * Add payment to expense
   */
  async addPayment(
    tenantId: string,
    expenseId: string,
    dto: AddPaymentDto,
    createdBy: string,
  ): Promise<typeof expensePayments.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Get expense
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!expense) {
      throw new Error("Expense not found");
    }

    if (expense.status !== "approved" && expense.status !== "paid") {
      throw new Error("Only approved expenses can be paid");
    }

    // Verify currency and payment method
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, dto.currencyId))
      .limit(1);

    if (!currency) {
      throw new Error("Currency not found");
    }

    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, dto.paymentMethodId))
      .limit(1);

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    // Calculate amount in base currency
    const amountInBaseCurrency = dto.amount * currency.exchangeRate;

    // Check if payment exceeds amount due
    if (amountInBaseCurrency > expense.amountDue) {
      throw new Error(
        `Payment amount (${amountInBaseCurrency}) exceeds amount due (${expense.amountDue})`,
      );
    }

    // Create payment
    const [payment] = await db
      .insert(expensePayments)
      .values({
        id: nanoid(),
        expenseId,
        amount: dto.amount,
        currencyId: dto.currencyId,
        paymentMethodId: dto.paymentMethodId,
        exchangeRate: currency.exchangeRate,
        amountInBaseCurrency,
        referenceNumber: dto.referenceNumber,
        paymentDate: dto.paymentDate || new Date(),
        notes: dto.notes,
        createdBy,
      })
      .returning();

    // Update expense amounts
    const newAmountPaid = expense.amountPaid + amountInBaseCurrency;
    const newAmountDue = expense.amountDue - amountInBaseCurrency;
    const isPaid = newAmountDue === 0;

    await db
      .update(expenses)
      .set({
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: isPaid ? "paid" : expense.status,
        paidDate: isPaid ? new Date() : expense.paidDate,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId));

    return payment;
  }

  /**
   * Get payments for an expense
   */
  async getPaymentsByExpense(
    tenantId: string,
    expenseId: string,
  ): Promise<(typeof expensePayments.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(expensePayments)
      .where(eq(expensePayments.expenseId, expenseId))
      .orderBy(expensePayments.paymentDate);
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(
    tenantId: string,
    expenseId: string,
  ): Promise<typeof expenses.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!expense) {
      throw new Error("Expense not found");
    }

    return expense;
  }

  /**
   * Get expenses with filters
   */
  async getExpenses(
    tenantId: string,
    filters: ExpenseFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<(typeof expenses.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    const conditions = [];

    if (filters.branchId) {
      conditions.push(eq(expenses.branchId, filters.branchId));
    }

    if (filters.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }

    if (filters.status) {
      conditions.push(eq(expenses.status, filters.status));
    }

    if (filters.startDate && filters.endDate) {
      conditions.push(
        between(
          expenses.expenseDate,
          filters.startDate,
          filters.endDate,
        ),
      );
    } else if (filters.startDate) {
      conditions.push(gte(expenses.expenseDate, filters.startDate));
    } else if (filters.endDate) {
      conditions.push(lte(expenses.expenseDate, filters.endDate));
    }

    if (filters.minAmount !== undefined) {
      conditions.push(gte(expenses.amountInBaseCurrency, filters.minAmount));
    }

    if (filters.maxAmount !== undefined) {
      conditions.push(lte(expenses.amountInBaseCurrency, filters.maxAmount));
    }

    if (filters.isTaxDeductible !== undefined) {
      conditions.push(eq(expenses.isTaxDeductible, filters.isTaxDeductible));
    }

    const query = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(expenses)
      .where(query)
      .orderBy(sql`${expenses.expenseDate} DESC`)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Generate recurring expenses
   */
  async generateRecurringExpenses(
    tenantId: string,
    generatedBy: string,
  ): Promise<(typeof expenses.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    // Get all active recurring expenses
    const recurringExpenses = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.isRecurring, true), eq(expenses.status, "paid")));

    const today = new Date();
    const generatedExpenses: (typeof expenses.$inferSelect)[] = [];

    for (const recurring of recurringExpenses) {
      // Check if end date passed
      if (recurring.recurringEndDate && today > recurring.recurringEndDate) {
        continue;
      }

      // Calculate next expense date
      const lastExpenseDate = recurring.expenseDate;
      const nextDate = this.calculateNextRecurringDate(
        lastExpenseDate,
        recurring.recurringFrequency!,
      );

      // If next date is in future, skip
      if (nextDate > today) {
        continue;
      }

      // Check if expense for this period already exists
      const [existing] = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.recurringParentId, recurring.id),
            eq(expenses.expenseDate, nextDate),
          ),
        )
        .limit(1);

      if (existing) {
        continue; // Already generated
      }

      // Create new expense
      const expenseNumber = await this.generateExpenseNumber(tenantId);

      const [newExpense] = await db
        .insert(expenses)
        .values({
          id: nanoid(),
          expenseNumber,
          branchId: recurring.branchId,
          categoryId: recurring.categoryId,
          vendor: recurring.vendor,
          description: `${recurring.description} (Recurring)`,
          amount: recurring.amount,
          currencyId: recurring.currencyId,
          exchangeRate: recurring.exchangeRate,
          amountInBaseCurrency: recurring.amountInBaseCurrency,
          expenseDate: nextDate,
          dueDate: this.calculateDueDate(nextDate, 30), // 30 days from expense date
          isTaxDeductible: recurring.isTaxDeductible,
          isRecurring: false, // Generated expenses are not recurring
          recurringParentId: recurring.id,
          amountDue: recurring.amountInBaseCurrency,
          status: "draft",
          notes: `Auto-generated from recurring expense ${recurring.expenseNumber}`,
          createdBy: generatedBy,
        })
        .returning();

      generatedExpenses.push(newExpense);
    }

    return generatedExpenses;
  }

  /**
   * Calculate next recurring date
   */
  private calculateNextRecurringDate(
    currentDate: Date,
    frequency: "monthly" | "quarterly" | "yearly",
  ): Date {
    const nextDate = new Date(currentDate);

    if (frequency === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (frequency === "quarterly") {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else {
      // yearly
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    return nextDate;
  }

  /**
   * Calculate due date
   */
  private calculateDueDate(expenseDate: Date, daysToAdd: number): Date {
    const dueDate = new Date(expenseDate);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate;
  }

  /**
   * Get expense summary/report
   */
  async getExpenseReport(
    tenantId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalExpenses: number;
    expensesByCategory: { categoryId: string; categoryName: string; total: number }[];
    expensesByStatus: { status: string; count: number; total: number }[];
    taxDeductibleTotal: number;
  }> {
    const db = getTenantDb(tenantId);

    // Get all expenses in date range
    const allExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.branchId, branchId),
          between(expenses.expenseDate, startDate, endDate),
        ),
      );

    // Total expenses
    const totalExpenses = allExpenses.reduce(
      (sum, exp) => sum + exp.amountInBaseCurrency,
      0,
    );

    // Expenses by category
    const categoryMap = new Map<string, { name: string; total: number }>();

    for (const exp of allExpenses) {
      const [category] = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, exp.categoryId))
        .limit(1);

      if (!category) continue;

      const existing = categoryMap.get(exp.categoryId);
      if (existing) {
        existing.total += exp.amountInBaseCurrency;
      } else {
        categoryMap.set(exp.categoryId, {
          name: category.name,
          total: exp.amountInBaseCurrency,
        });
      }
    }

    const expensesByCategory = Array.from(categoryMap.entries()).map(
      ([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        total: data.total,
      }),
    );

    // Expenses by status
    const statusMap = new Map<string, { count: number; total: number }>();

    for (const exp of allExpenses) {
      const existing = statusMap.get(exp.status);
      if (existing) {
        existing.count++;
        existing.total += exp.amountInBaseCurrency;
      } else {
        statusMap.set(exp.status, {
          count: 1,
          total: exp.amountInBaseCurrency,
        });
      }
    }

    const expensesByStatus = Array.from(statusMap.entries()).map(
      ([status, data]) => ({
        status,
        count: data.count,
        total: data.total,
      }),
    );

    // Tax deductible total
    const taxDeductibleTotal = allExpenses
      .filter((exp) => exp.isTaxDeductible)
      .reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);

    return {
      totalExpenses,
      expensesByCategory,
      expensesByStatus,
      taxDeductibleTotal,
    };
  }
}
