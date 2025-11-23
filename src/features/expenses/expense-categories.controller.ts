import { Request, Response } from "express";
import { ExpenseCategoriesService } from "./expense-categories.service";

const categoriesService = new ExpenseCategoriesService();

export class ExpenseCategoriesController {
  /**
   * Initialize default categories for a branch
   */
  async initializeDefaultCategories(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const categories = await categoriesService.initializeDefaultCategories(
        tenantId,
        branchId,
      );

      res.status(201).json(categories);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize categories",
      });
    }
  }

  /**
   * Create a new category
   */
  async createCategory(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const category = await categoriesService.createCategory(
        tenantId,
        req.body,
      );
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to create category",
      });
    }
  }

  /**
   * Update a category
   */
  async updateCategory(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { categoryId } = req.params;

      const category = await categoriesService.updateCategory(
        tenantId,
        categoryId,
        req.body,
      );

      res.json(category);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to update category",
      });
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { categoryId } = req.params;

      const category = await categoriesService.deleteCategory(
        tenantId,
        categoryId,
      );

      res.json(category);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to delete category",
      });
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { categoryId } = req.params;

      const category = await categoriesService.getCategoryById(
        tenantId,
        categoryId,
      );

      res.json(category);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "Category not found",
      });
    }
  }

  /**
   * Get all categories for a branch
   */
  async getCategoriesByBranch(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const categories = await categoriesService.getCategoriesByBranch(
        tenantId,
        branchId,
      );

      res.json(categories);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get categories",
      });
    }
  }

  /**
   * Get active categories for a branch
   */
  async getActiveCategoriesByBranch(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const categories = await categoriesService.getActiveCategoriesByBranch(
        tenantId,
        branchId,
      );

      res.json(categories);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get categories",
      });
    }
  }

  /**
   * Get category tree for a branch
   */
  async getCategoryTree(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const tree = await categoriesService.getCategoryTree(tenantId, branchId);

      res.json(tree);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get category tree",
      });
    }
  }

  /**
   * Get root categories for a branch
   */
  async getRootCategories(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const categories = await categoriesService.getRootCategories(
        tenantId,
        branchId,
      );

      res.json(categories);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get root categories",
      });
    }
  }

  /**
   * Get subcategories of a category
   */
  async getSubcategories(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { categoryId } = req.params;

      const subcategories = await categoriesService.getSubcategories(
        tenantId,
        categoryId,
      );

      res.json(subcategories);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get subcategories",
      });
    }
  }
}
