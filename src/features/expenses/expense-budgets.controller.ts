import { Request, Response } from "express";
import { ExpenseBudgetsService } from "./expense-budgets.service";

const budgetsService = new ExpenseBudgetsService();

export class ExpenseBudgetsController {
  /**
   * Create a new budget
   */
  async createBudget(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const createdBy = req.userId!;

      const budget = await budgetsService.createBudget(
        tenantId,
        req.body,
        createdBy,
      );

      res.status(201).json(budget);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to create budget",
      });
    }
  }

  /**
   * Update a budget
   */
  async updateBudget(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { budgetId } = req.params;

      const budget = await budgetsService.updateBudget(
        tenantId,
        budgetId,
        req.body,
      );

      res.json(budget);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to update budget",
      });
    }
  }

  /**
   * Delete a budget
   */
  async deleteBudget(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { budgetId } = req.params;

      const budget = await budgetsService.deleteBudget(tenantId, budgetId);

      res.json(budget);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to delete budget",
      });
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { budgetId } = req.params;

      const budget = await budgetsService.getBudgetById(tenantId, budgetId);

      res.json(budget);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "Budget not found",
      });
    }
  }

  /**
   * Get budgets by branch
   */
  async getBudgetsByBranch(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;
      const period = req.query.period as "monthly" | "quarterly" | "yearly" | undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

      const budgets = await budgetsService.getBudgetsByBranch(
        tenantId,
        branchId,
        period,
        year,
      );

      res.json(budgets);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get budgets",
      });
    }
  }

  /**
   * Get budget utilization
   */
  async getBudgetUtilization(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;
      const period = req.query.period as "monthly" | "quarterly" | "yearly" | undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const quarter = req.query.quarter ? parseInt(req.query.quarter as string, 10) : undefined;

      const utilization = await budgetsService.getBudgetUtilization(
        tenantId,
        branchId,
        period,
        year,
        month,
        quarter,
      );

      res.json(utilization);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get budget utilization",
      });
    }
  }

  /**
   * Get over-budget categories
   */
  async getOverBudgetCategories(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const overBudget = await budgetsService.getOverBudgetCategories(
        tenantId,
        branchId,
      );

      res.json(overBudget);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get over-budget categories",
      });
    }
  }
}
