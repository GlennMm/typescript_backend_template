import { Request, Response } from "express";
import { ExpensesService } from "./expenses.service";

const expensesService = new ExpensesService();

export class ExpensesController {
  /**
   * Create a new expense
   */
  async createExpense(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const createdBy = req.userId!;

      const expense = await expensesService.createExpense(
        tenantId,
        req.body,
        createdBy,
      );

      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to create expense",
      });
    }
  }

  /**
   * Update an expense
   */
  async updateExpense(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { expenseId } = req.params;

      const expense = await expensesService.updateExpense(
        tenantId,
        expenseId,
        req.body,
      );

      res.json(expense);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to update expense",
      });
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { expenseId } = req.params;

      const expense = await expensesService.deleteExpense(tenantId, expenseId);

      res.json(expense);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to delete expense",
      });
    }
  }

  /**
   * Submit expense for approval
   */
  async submitExpense(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { expenseId } = req.params;
      const submittedBy = req.userId!;

      const expense = await expensesService.submitExpense(
        tenantId,
        expenseId,
        submittedBy,
      );

      res.json(expense);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to submit expense",
      });
    }
  }

  /**
   * Approve an expense
   */
  async approveExpense(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { expenseId } = req.params;
      const approvedBy = req.userId!;

      const expense = await expensesService.approveExpense(
        tenantId,
        expenseId,
        approvedBy,
      );

      res.json(expense);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to approve expense",
      });
    }
  }

  /**
   * Reject an expense
   */
  async rejectExpense(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { expenseId } = req.params;
      const rejectedBy = req.userId!;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      const expense = await expensesService.rejectExpense(
        tenantId,
        expenseId,
        rejectedBy,
        reason,
      );

      res.json(expense);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to reject expense",
      });
    }
  }

  /**
   * Add payment to expense
   */
  async addPayment(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { expenseId } = req.params;
      const createdBy = req.userId!;

      const payment = await expensesService.addPayment(
        tenantId,
        expenseId,
        req.body,
        createdBy,
      );

      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to add payment",
      });
    }
  }

  /**
   * Get payments for an expense
   */
  async getPaymentsByExpense(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { expenseId } = req.params;

      const payments = await expensesService.getPaymentsByExpense(
        tenantId,
        expenseId,
      );

      res.json(payments);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get payments",
      });
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { expenseId } = req.params;

      const expense = await expensesService.getExpenseById(tenantId, expenseId);

      res.json(expense);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "Expense not found",
      });
    }
  }

  /**
   * Get expenses with filters
   */
  async getExpenses(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const filters = {
        branchId: req.query.branchId as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        status: req.query.status as
          | "draft"
          | "submitted"
          | "approved"
          | "rejected"
          | "paid"
          | undefined,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        minAmount: req.query.minAmount
          ? parseFloat(req.query.minAmount as string)
          : undefined,
        maxAmount: req.query.maxAmount
          ? parseFloat(req.query.maxAmount as string)
          : undefined,
        isTaxDeductible:
          req.query.isTaxDeductible === "true"
            ? true
            : req.query.isTaxDeductible === "false"
              ? false
              : undefined,
      };

      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : 0;

      const expenses = await expensesService.getExpenses(
        tenantId,
        filters,
        limit,
        offset,
      );

      res.json(expenses);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get expenses",
      });
    }
  }

  /**
   * Generate recurring expenses
   */
  async generateRecurringExpenses(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const generatedBy = req.userId!;

      const expenses = await expensesService.generateRecurringExpenses(
        tenantId,
        generatedBy,
      );

      res.json({
        message: `Generated ${expenses.length} recurring expense(s)`,
        expenses,
      });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate recurring expenses",
      });
    }
  }

  /**
   * Get expense report
   */
  async getExpenseReport(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Start of current month

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(); // Today

      const report = await expensesService.getExpenseReport(
        tenantId,
        branchId,
        startDate,
        endDate,
      );

      res.json(report);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get expense report",
      });
    }
  }
}
