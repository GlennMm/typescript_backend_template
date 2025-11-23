import { and, eq, sql } from "drizzle-orm";
import { getTenantDb } from "@/db/connection";
import {
  branches,
  expenseCategories,
  expenseBudgets,
  expenses,
} from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";

interface CreateBudgetDto {
  branchId: string;
  categoryId: string;
  period: "monthly" | "quarterly" | "yearly";
  year: number;
  month?: number; // 1-12 for monthly
  quarter?: number; // 1-4 for quarterly
  budgetAmount: number;
}

interface UpdateBudgetDto {
  budgetAmount?: number;
}

interface BudgetUtilization {
  budget: typeof expenseBudgets.$inferSelect;
  category: typeof expenseCategories.$inferSelect;
  actualSpent: number;
  remaining: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
}

export class ExpenseBudgetsService {
  /**
   * Create a new budget
   */
  async createBudget(
    tenantId: string,
    dto: CreateBudgetDto,
    createdBy: string,
  ): Promise<typeof expenseBudgets.$inferSelect> {
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

    // Validate period-specific fields
    if (dto.period === "monthly" && !dto.month) {
      throw new Error("Month is required for monthly budgets");
    }

    if (dto.period === "quarterly" && !dto.quarter) {
      throw new Error("Quarter is required for quarterly budgets");
    }

    if (dto.period === "monthly" && (dto.month! < 1 || dto.month! > 12)) {
      throw new Error("Month must be between 1 and 12");
    }

    if (dto.period === "quarterly" && (dto.quarter! < 1 || dto.quarter! > 4)) {
      throw new Error("Quarter must be between 1 and 4");
    }

    // Check for duplicate budget
    const conditions = [
      eq(expenseBudgets.branchId, dto.branchId),
      eq(expenseBudgets.categoryId, dto.categoryId),
      eq(expenseBudgets.period, dto.period),
      eq(expenseBudgets.year, dto.year),
    ];

    if (dto.period === "monthly") {
      conditions.push(eq(expenseBudgets.month, dto.month!));
    } else if (dto.period === "quarterly") {
      conditions.push(eq(expenseBudgets.quarter, dto.quarter!));
    }

    const [existing] = await db
      .select()
      .from(expenseBudgets)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      throw new Error("Budget already exists for this category and period");
    }

    const [budget] = await db
      .insert(expenseBudgets)
      .values({
        id: nanoid(),
        branchId: dto.branchId,
        categoryId: dto.categoryId,
        period: dto.period,
        year: dto.year,
        month: dto.period === "monthly" ? dto.month : null,
        quarter: dto.period === "quarterly" ? dto.quarter : null,
        budgetAmount: dto.budgetAmount,
        createdBy,
      })
      .returning();

    return budget;
  }

  /**
   * Update a budget
   */
  async updateBudget(
    tenantId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
  ): Promise<typeof expenseBudgets.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [existing] = await db
      .select()
      .from(expenseBudgets)
      .where(eq(expenseBudgets.id, budgetId))
      .limit(1);

    if (!existing) {
      throw new Error("Budget not found");
    }

    const [updated] = await db
      .update(expenseBudgets)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(expenseBudgets.id, budgetId))
      .returning();

    return updated;
  }

  /**
   * Delete a budget
   */
  async deleteBudget(
    tenantId: string,
    budgetId: string,
  ): Promise<typeof expenseBudgets.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [deleted] = await db
      .delete(expenseBudgets)
      .where(eq(expenseBudgets.id, budgetId))
      .returning();

    if (!deleted) {
      throw new Error("Budget not found");
    }

    return deleted;
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(
    tenantId: string,
    budgetId: string,
  ): Promise<typeof expenseBudgets.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [budget] = await db
      .select()
      .from(expenseBudgets)
      .where(eq(expenseBudgets.id, budgetId))
      .limit(1);

    if (!budget) {
      throw new Error("Budget not found");
    }

    return budget;
  }

  /**
   * Get budgets by branch
   */
  async getBudgetsByBranch(
    tenantId: string,
    branchId: string,
    period?: "monthly" | "quarterly" | "yearly",
    year?: number,
  ): Promise<(typeof expenseBudgets.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    const conditions = [eq(expenseBudgets.branchId, branchId)];

    if (period) {
      conditions.push(eq(expenseBudgets.period, period));
    }

    if (year) {
      conditions.push(eq(expenseBudgets.year, year));
    }

    return await db
      .select()
      .from(expenseBudgets)
      .where(and(...conditions))
      .orderBy(expenseBudgets.year, expenseBudgets.period);
  }

  /**
   * Get budget utilization for a branch
   */
  async getBudgetUtilization(
    tenantId: string,
    branchId: string,
    period?: "monthly" | "quarterly" | "yearly",
    year?: number,
    month?: number,
    quarter?: number,
  ): Promise<BudgetUtilization[]> {
    const db = getTenantDb(tenantId);

    // Get budgets
    const conditions = [eq(expenseBudgets.branchId, branchId)];

    if (period) {
      conditions.push(eq(expenseBudgets.period, period));
    }

    if (year) {
      conditions.push(eq(expenseBudgets.year, year));
    }

    if (month) {
      conditions.push(eq(expenseBudgets.month, month));
    }

    if (quarter) {
      conditions.push(eq(expenseBudgets.quarter, quarter));
    }

    const budgets = await db
      .select()
      .from(expenseBudgets)
      .where(and(...conditions));

    const utilizations: BudgetUtilization[] = [];

    for (const budget of budgets) {
      // Get category
      const [category] = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, budget.categoryId))
        .limit(1);

      if (!category) continue;

      // Calculate date range for this budget period
      const { startDate, endDate } = this.getBudgetDateRange(budget);

      // Get actual expenses for this category and period
      const result = await db
        .select({
          total: sql<number>`SUM(${expenses.amountInBaseCurrency})`,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.branchId, branchId),
            eq(expenses.categoryId, budget.categoryId),
            sql`${expenses.expenseDate} >= ${startDate.getTime() / 1000}`,
            sql`${expenses.expenseDate} <= ${endDate.getTime() / 1000}`,
            sql`${expenses.status} IN ('approved', 'paid')`, // Only count approved/paid expenses
          ),
        );

      const actualSpent = result[0]?.total || 0;
      const remaining = budget.budgetAmount - actualSpent;
      const utilizationPercentage = (actualSpent / budget.budgetAmount) * 100;
      const isOverBudget = actualSpent > budget.budgetAmount;

      utilizations.push({
        budget,
        category,
        actualSpent,
        remaining,
        utilizationPercentage,
        isOverBudget,
      });
    }

    return utilizations;
  }

  /**
   * Get over-budget categories
   */
  async getOverBudgetCategories(
    tenantId: string,
    branchId: string,
  ): Promise<BudgetUtilization[]> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    // Get utilization for current periods
    const [monthlyUtil, quarterlyUtil, yearlyUtil] = await Promise.all([
      this.getBudgetUtilization(
        tenantId,
        branchId,
        "monthly",
        currentYear,
        currentMonth,
      ),
      this.getBudgetUtilization(
        tenantId,
        branchId,
        "quarterly",
        currentYear,
        undefined,
        currentQuarter,
      ),
      this.getBudgetUtilization(tenantId, branchId, "yearly", currentYear),
    ]);

    const allUtilizations = [...monthlyUtil, ...quarterlyUtil, ...yearlyUtil];

    return allUtilizations.filter((util) => util.isOverBudget);
  }

  /**
   * Get date range for a budget period
   */
  private getBudgetDateRange(
    budget: typeof expenseBudgets.$inferSelect,
  ): { startDate: Date; endDate: Date } {
    const year = budget.year;

    if (budget.period === "monthly") {
      const month = budget.month! - 1; // JS months are 0-indexed
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59); // Last day of month

      return { startDate, endDate };
    } else if (budget.period === "quarterly") {
      const startMonth = (budget.quarter! - 1) * 3;
      const endMonth = startMonth + 3;

      const startDate = new Date(year, startMonth, 1);
      const endDate = new Date(year, endMonth, 0, 23, 59, 59); // Last day of quarter

      return { startDate, endDate };
    } else {
      // yearly
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      return { startDate, endDate };
    }
  }
}
