import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { ExpenseCategoriesController } from "./expense-categories.controller";
import { ExpenseBudgetsController } from "./expense-budgets.controller";
import { ExpensesController } from "./expenses.controller";

const router = Router();

const categoriesController = new ExpenseCategoriesController();
const budgetsController = new ExpenseBudgetsController();
const expensesController = new ExpensesController();

// ============================================
// EXPENSE CATEGORIES ROUTES
// ============================================

/**
 * @swagger
 * /api/expenses/branches/{branchId}/categories/initialize:
 *   post:
 *     tags: [Expense Categories]
 *     summary: Initialize default expense categories for a branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Default categories initialized
 */
router.post(
  "/branches/:branchId/categories/initialize",
  authenticate,
  categoriesController.initializeDefaultCategories,
);

/**
 * @swagger
 * /api/expenses/categories:
 *   post:
 *     tags: [Expense Categories]
 *     summary: Create a new expense category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Category created
 */
router.post("/categories", authenticate, categoriesController.createCategory);

/**
 * @swagger
 * /api/expenses/categories/{categoryId}:
 *   get:
 *     tags: [Expense Categories]
 *     summary: Get category by ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category details
 */
router.get(
  "/categories/:categoryId",
  authenticate,
  categoriesController.getCategoryById,
);

/**
 * @swagger
 * /api/expenses/categories/{categoryId}:
 *   put:
 *     tags: [Expense Categories]
 *     summary: Update an expense category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put(
  "/categories/:categoryId",
  authenticate,
  categoriesController.updateCategory,
);

/**
 * @swagger
 * /api/expenses/categories/{categoryId}:
 *   delete:
 *     tags: [Expense Categories]
 *     summary: Delete an expense category (soft delete)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete(
  "/categories/:categoryId",
  authenticate,
  categoriesController.deleteCategory,
);

/**
 * @swagger
 * /api/expenses/branches/{branchId}/categories:
 *   get:
 *     tags: [Expense Categories]
 *     summary: Get all categories for a branch (flat list)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get(
  "/branches/:branchId/categories",
  authenticate,
  categoriesController.getCategoriesByBranch,
);

/**
 * @swagger
 * /api/expenses/branches/{branchId}/categories/active:
 *   get:
 *     tags: [Expense Categories]
 *     summary: Get active categories for a branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active categories
 */
router.get(
  "/branches/:branchId/categories/active",
  authenticate,
  categoriesController.getActiveCategoriesByBranch,
);

/**
 * @swagger
 * /api/expenses/branches/{branchId}/categories/tree:
 *   get:
 *     tags: [Expense Categories]
 *     summary: Get category hierarchy tree for a branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category tree structure
 */
router.get(
  "/branches/:branchId/categories/tree",
  authenticate,
  categoriesController.getCategoryTree,
);

/**
 * @swagger
 * /api/expenses/branches/{branchId}/categories/root:
 *   get:
 *     tags: [Expense Categories]
 *     summary: Get root categories (no parent) for a branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of root categories
 */
router.get(
  "/branches/:branchId/categories/root",
  authenticate,
  categoriesController.getRootCategories,
);

/**
 * @swagger
 * /api/expenses/categories/{categoryId}/subcategories:
 *   get:
 *     tags: [Expense Categories]
 *     summary: Get subcategories of a category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subcategories
 */
router.get(
  "/categories/:categoryId/subcategories",
  authenticate,
  categoriesController.getSubcategories,
);

// ============================================
// EXPENSE BUDGETS ROUTES
// ============================================

/**
 * @swagger
 * /api/expenses/budgets:
 *   post:
 *     tags: [Expense Budgets]
 *     summary: Create a new budget
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Budget created
 */
router.post("/budgets", authenticate, budgetsController.createBudget);

/**
 * @swagger
 * /api/expenses/budgets/{budgetId}:
 *   get:
 *     tags: [Expense Budgets]
 *     summary: Get budget by ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Budget details
 */
router.get("/budgets/:budgetId", authenticate, budgetsController.getBudgetById);

/**
 * @swagger
 * /api/expenses/budgets/{budgetId}:
 *   put:
 *     tags: [Expense Budgets]
 *     summary: Update a budget
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Budget updated
 */
router.put("/budgets/:budgetId", authenticate, budgetsController.updateBudget);

/**
 * @swagger
 * /api/expenses/budgets/{budgetId}:
 *   delete:
 *     tags: [Expense Budgets]
 *     summary: Delete a budget
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Budget deleted
 */
router.delete("/budgets/:budgetId", authenticate, budgetsController.deleteBudget);

/**
 * @swagger
 * /api/expenses/branches/{branchId}/budgets:
 *   get:
 *     tags: [Expense Budgets]
 *     summary: Get budgets for a branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of budgets
 */
router.get(
  "/branches/:branchId/budgets",
  authenticate,
  budgetsController.getBudgetsByBranch,
);

/**
 * @swagger
 * /api/expenses/branches/{branchId}/budgets/utilization:
 *   get:
 *     tags: [Expense Budgets]
 *     summary: Get budget utilization for a branch (actual vs budget)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Budget utilization data
 */
router.get(
  "/branches/:branchId/budgets/utilization",
  authenticate,
  budgetsController.getBudgetUtilization,
);

/**
 * @swagger
 * /api/expenses/branches/{branchId}/budgets/over-budget:
 *   get:
 *     tags: [Expense Budgets]
 *     summary: Get over-budget categories for a branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of over-budget categories
 */
router.get(
  "/branches/:branchId/budgets/over-budget",
  authenticate,
  budgetsController.getOverBudgetCategories,
);

// ============================================
// EXPENSES ROUTES
// ============================================

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     tags: [Expenses]
 *     summary: Create a new expense (draft status)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Expense created
 */
router.post("/", authenticate, expensesController.createExpense);

/**
 * @swagger
 * /api/expenses/{expenseId}:
 *   get:
 *     tags: [Expenses]
 *     summary: Get expense by ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense details
 */
router.get("/:expenseId", authenticate, expensesController.getExpenseById);

/**
 * @swagger
 * /api/expenses/{expenseId}:
 *   put:
 *     tags: [Expenses]
 *     summary: Update an expense (draft only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense updated
 */
router.put("/:expenseId", authenticate, expensesController.updateExpense);

/**
 * @swagger
 * /api/expenses/{expenseId}:
 *   delete:
 *     tags: [Expenses]
 *     summary: Delete an expense (draft only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.delete("/:expenseId", authenticate, expensesController.deleteExpense);

/**
 * @swagger
 * /api/expenses/{expenseId}/submit:
 *   post:
 *     tags: [Expenses]
 *     summary: Submit expense for approval
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense submitted
 */
router.post(
  "/:expenseId/submit",
  authenticate,
  expensesController.submitExpense,
);

/**
 * @swagger
 * /api/expenses/{expenseId}/approve:
 *   post:
 *     tags: [Expenses]
 *     summary: Approve an expense
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense approved
 */
router.post(
  "/:expenseId/approve",
  authenticate,
  expensesController.approveExpense,
);

/**
 * @swagger
 * /api/expenses/{expenseId}/reject:
 *   post:
 *     tags: [Expenses]
 *     summary: Reject an expense
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense rejected
 */
router.post(
  "/:expenseId/reject",
  authenticate,
  expensesController.rejectExpense,
);

/**
 * @swagger
 * /api/expenses/{expenseId}/payments:
 *   post:
 *     tags: [Expenses]
 *     summary: Add payment to expense (supports partial payments)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Payment added
 */
router.post(
  "/:expenseId/payments",
  authenticate,
  expensesController.addPayment,
);

/**
 * @swagger
 * /api/expenses/{expenseId}/payments:
 *   get:
 *     tags: [Expenses]
 *     summary: Get payments for an expense
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get(
  "/:expenseId/payments",
  authenticate,
  expensesController.getPaymentsByExpense,
);

/**
 * @swagger
 * /api/expenses/list:
 *   get:
 *     tags: [Expenses]
 *     summary: Get expenses with filters
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expenses
 */
router.get("/list", authenticate, expensesController.getExpenses);

/**
 * @swagger
 * /api/expenses/recurring/generate:
 *   post:
 *     tags: [Expenses]
 *     summary: Generate recurring expenses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recurring expenses generated
 */
router.post(
  "/recurring/generate",
  authenticate,
  expensesController.generateRecurringExpenses,
);

/**
 * @swagger
 * /api/expenses/branches/{branchId}/report:
 *   get:
 *     tags: [Expenses]
 *     summary: Get expense report for a branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense report with breakdowns
 */
router.get(
  "/branches/:branchId/report",
  authenticate,
  expensesController.getExpenseReport,
);

export default router;
