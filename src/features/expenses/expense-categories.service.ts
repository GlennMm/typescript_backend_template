import { and, eq, isNull } from "drizzle-orm";
import { getTenantDb } from "@/db/connection";
import { branches, expenseCategories } from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";

interface CreateCategoryDto {
  branchId: string;
  name: string;
  description?: string;
  parentId?: string;
}

interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

interface CategoryTree {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isDefault: boolean;
  isActive: boolean;
  children: CategoryTree[];
}

// Default expense categories
const DEFAULT_CATEGORIES = [
  { name: "Rent", description: "Property rental and lease payments" },
  { name: "Utilities", description: "Electricity, water, internet, phone" },
  { name: "Salaries", description: "Employee salaries and wages" },
  { name: "Supplies", description: "Office and operational supplies" },
  { name: "Maintenance", description: "Repairs and maintenance costs" },
  { name: "Marketing", description: "Advertising and promotional expenses" },
];

export class ExpenseCategoriesService {
  /**
   * Initialize default categories for a branch
   */
  async initializeDefaultCategories(
    tenantId: string,
    branchId: string,
  ): Promise<(typeof expenseCategories.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    // Verify branch exists
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    // Check if categories already exist for this branch
    const existing = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.branchId, branchId))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Default categories already initialized for this branch");
    }

    // Create default categories
    const categories: (typeof expenseCategories.$inferSelect)[] = [];

    for (const category of DEFAULT_CATEGORIES) {
      const [created] = await db
        .insert(expenseCategories)
        .values({
          id: nanoid(),
          branchId,
          name: category.name,
          description: category.description,
          isDefault: true,
        })
        .returning();

      categories.push(created);
    }

    return categories;
  }

  /**
   * Create a new expense category
   */
  async createCategory(
    tenantId: string,
    dto: CreateCategoryDto,
  ): Promise<typeof expenseCategories.$inferSelect> {
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

    // If parentId provided, verify it exists and belongs to same branch
    if (dto.parentId) {
      const [parent] = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, dto.parentId))
        .limit(1);

      if (!parent) {
        throw new Error("Parent category not found");
      }

      if (parent.branchId !== dto.branchId) {
        throw new Error("Parent category must belong to the same branch");
      }
    }

    // Check for duplicate name in same branch
    const [existing] = await db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.branchId, dto.branchId),
          eq(expenseCategories.name, dto.name),
        ),
      )
      .limit(1);

    if (existing) {
      throw new Error("Category with this name already exists in this branch");
    }

    const [category] = await db
      .insert(expenseCategories)
      .values({
        id: nanoid(),
        branchId: dto.branchId,
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId,
        isDefault: false,
      })
      .returning();

    return category;
  }

  /**
   * Update an expense category
   */
  async updateCategory(
    tenantId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<typeof expenseCategories.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Get existing category
    const [existing] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.id, categoryId))
      .limit(1);

    if (!existing) {
      throw new Error("Category not found");
    }

    // If updating parentId, verify it exists and prevents circular reference
    if (dto.parentId !== undefined) {
      if (dto.parentId === categoryId) {
        throw new Error("Category cannot be its own parent");
      }

      if (dto.parentId) {
        const [parent] = await db
          .select()
          .from(expenseCategories)
          .where(eq(expenseCategories.id, dto.parentId))
          .limit(1);

        if (!parent) {
          throw new Error("Parent category not found");
        }

        if (parent.branchId !== existing.branchId) {
          throw new Error("Parent category must belong to the same branch");
        }

        // Check for circular reference
        const isCircular = await this.wouldCreateCircularReference(
          tenantId,
          categoryId,
          dto.parentId,
        );

        if (isCircular) {
          throw new Error("Cannot create circular category reference");
        }
      }
    }

    // If updating name, check for duplicates
    if (dto.name && dto.name !== existing.name) {
      const [duplicate] = await db
        .select()
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.branchId, existing.branchId),
            eq(expenseCategories.name, dto.name),
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new Error("Category with this name already exists in this branch");
      }
    }

    const [updated] = await db
      .update(expenseCategories)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(expenseCategories.id, categoryId))
      .returning();

    return updated;
  }

  /**
   * Check if setting a parent would create a circular reference
   */
  private async wouldCreateCircularReference(
    tenantId: string,
    categoryId: string,
    newParentId: string,
  ): Promise<boolean> {
    const db = getTenantDb(tenantId);
    let currentId: string | null = newParentId;

    // Traverse up the parent chain
    while (currentId) {
      if (currentId === categoryId) {
        return true; // Circular reference found
      }

      const [parent] = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, currentId))
        .limit(1);

      if (!parent) break;
      currentId = parent.parentId;
    }

    return false;
  }

  /**
   * Delete a category (soft delete)
   */
  async deleteCategory(
    tenantId: string,
    categoryId: string,
  ): Promise<typeof expenseCategories.$inferSelect> {
    const db = getTenantDb(tenantId);

    // Check if category has children
    const children = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.parentId, categoryId))
      .limit(1);

    if (children.length > 0) {
      throw new Error(
        "Cannot delete category with subcategories. Delete or move subcategories first.",
      );
    }

    const [deleted] = await db
      .update(expenseCategories)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(expenseCategories.id, categoryId))
      .returning();

    if (!deleted) {
      throw new Error("Category not found");
    }

    return deleted;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(
    tenantId: string,
    categoryId: string,
  ): Promise<typeof expenseCategories.$inferSelect> {
    const db = getTenantDb(tenantId);

    const [category] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }

  /**
   * Get all categories for a branch (flat list)
   */
  async getCategoriesByBranch(
    tenantId: string,
    branchId: string,
  ): Promise<(typeof expenseCategories.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.branchId, branchId))
      .orderBy(expenseCategories.name);
  }

  /**
   * Get active categories for a branch
   */
  async getActiveCategoriesByBranch(
    tenantId: string,
    branchId: string,
  ): Promise<(typeof expenseCategories.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.branchId, branchId),
          eq(expenseCategories.isActive, true),
        ),
      )
      .orderBy(expenseCategories.name);
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(
    tenantId: string,
    branchId: string,
  ): Promise<CategoryTree[]> {
    const db = getTenantDb(tenantId);

    // Get all categories for branch
    const allCategories = await db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.branchId, branchId),
          eq(expenseCategories.isActive, true),
        ),
      );

    // Build tree structure
    const categoryMap = new Map<string, CategoryTree>();
    const rootCategories: CategoryTree[] = [];

    // First pass: Create all nodes
    for (const cat of allCategories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parentId: cat.parentId,
        isDefault: cat.isDefault,
        isActive: cat.isActive,
        children: [],
      });
    }

    // Second pass: Build tree
    for (const cat of allCategories) {
      const node = categoryMap.get(cat.id)!;

      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    }

    return rootCategories;
  }

  /**
   * Get root categories (categories without parent)
   */
  async getRootCategories(
    tenantId: string,
    branchId: string,
  ): Promise<(typeof expenseCategories.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.branchId, branchId),
          isNull(expenseCategories.parentId),
          eq(expenseCategories.isActive, true),
        ),
      )
      .orderBy(expenseCategories.name);
  }

  /**
   * Get subcategories of a category
   */
  async getSubcategories(
    tenantId: string,
    parentId: string,
  ): Promise<(typeof expenseCategories.$inferSelect)[]> {
    const db = getTenantDb(tenantId);

    return await db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.parentId, parentId),
          eq(expenseCategories.isActive, true),
        ),
      )
      .orderBy(expenseCategories.name);
  }
}
