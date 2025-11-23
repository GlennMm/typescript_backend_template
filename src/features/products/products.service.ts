import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import {
  productCategories,
  products,
} from "../../db/schemas/tenant.schema";
import type {
  CreateCategoryDto,
  CreateProductDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from "./products.validation";

export class ProductsService {
  // Product Category Methods

  async getAllCategories(tenantId: string) {
    const db = getTenantDb(tenantId);

    const categories = await db
      .select()
      .from(productCategories)
      .orderBy(productCategories.name);

    return categories;
  }

  async getCategoryById(tenantId: string, categoryId: string) {
    const db = getTenantDb(tenantId);

    const [category] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }

  async createCategory(tenantId: string, dto: CreateCategoryDto) {
    const db = getTenantDb(tenantId);

    // Verify parent category exists if provided
    if (dto.parentId) {
      const [parent] = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, dto.parentId))
        .limit(1);

      if (!parent) {
        throw new Error("Parent category not found");
      }
    }

    const [newCategory] = await db
      .insert(productCategories)
      .values({
        id: nanoid(),
        name: dto.name,
        description: dto.description || null,
        parentId: dto.parentId || null,
        isActive: dto.isActive,
      })
      .returning();

    return newCategory;
  }

  async updateCategory(
    tenantId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ) {
    const db = getTenantDb(tenantId);

    // Check if category exists
    const [existingCategory] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, categoryId))
      .limit(1);

    if (!existingCategory) {
      throw new Error("Category not found");
    }

    // Verify parent category exists if provided
    if (dto.parentId) {
      const [parent] = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, dto.parentId))
        .limit(1);

      if (!parent) {
        throw new Error("Parent category not found");
      }

      // Prevent circular reference
      if (dto.parentId === categoryId) {
        throw new Error("Category cannot be its own parent");
      }
    }

    const [updatedCategory] = await db
      .update(productCategories)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(productCategories.id, categoryId))
      .returning();

    return updatedCategory;
  }

  async deleteCategory(tenantId: string, categoryId: string) {
    const db = getTenantDb(tenantId);

    const [category] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has products
    const [productsInCategory] = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .limit(1);

    if (productsInCategory) {
      throw new Error(
        "Cannot delete category with products. Please reassign or delete products first.",
      );
    }

    await db.delete(productCategories).where(eq(productCategories.id, categoryId));

    return { message: "Category deleted successfully" };
  }

  // Product Methods

  async getAllProducts(tenantId: string) {
    const db = getTenantDb(tenantId);

    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        categoryId: products.categoryId,
        categoryName: productCategories.name,
        price: products.price,
        cost: products.cost,
        unit: products.unit,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(
        productCategories,
        eq(products.categoryId, productCategories.id),
      )
      .orderBy(products.name);

    return allProducts;
  }

  async getProductById(tenantId: string, productId: string) {
    const db = getTenantDb(tenantId);

    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        categoryId: products.categoryId,
        categoryName: productCategories.name,
        description: products.description,
        price: products.price,
        cost: products.cost,
        unit: products.unit,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(
        productCategories,
        eq(products.categoryId, productCategories.id),
      )
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }

  async createProduct(tenantId: string, dto: CreateProductDto) {
    const db = getTenantDb(tenantId);

    // Check if SKU already exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.sku, dto.sku))
      .limit(1);

    if (existingProduct) {
      throw new Error("Product with this SKU already exists");
    }

    // Verify category exists if provided
    if (dto.categoryId) {
      const [category] = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, dto.categoryId))
        .limit(1);

      if (!category) {
        throw new Error("Category not found");
      }
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        id: nanoid(),
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode || null,
        categoryId: dto.categoryId || null,
        description: dto.description || null,
        price: dto.price,
        cost: dto.cost || null,
        unit: dto.unit,
        imageUrl: dto.imageUrl || null,
        isActive: dto.isActive,
      })
      .returning();

    return newProduct;
  }

  async updateProduct(
    tenantId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    const db = getTenantDb(tenantId);

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // If SKU is being updated, check if it's already taken
    if (dto.sku && dto.sku !== existingProduct.sku) {
      const [skuTaken] = await db
        .select()
        .from(products)
        .where(eq(products.sku, dto.sku))
        .limit(1);

      if (skuTaken) {
        throw new Error("SKU already in use");
      }
    }

    // Verify category exists if provided
    if (dto.categoryId) {
      const [category] = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, dto.categoryId))
        .limit(1);

      if (!category) {
        throw new Error("Category not found");
      }
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return updatedProduct;
  }

  async deleteProduct(tenantId: string, productId: string) {
    const db = getTenantDb(tenantId);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if product has inventory
    const { branchInventory } = await import("../../db/schemas/tenant.schema");
    const [inventory] = await db
      .select()
      .from(branchInventory)
      .where(eq(branchInventory.productId, productId))
      .limit(1);

    if (inventory) {
      throw new Error(
        "Cannot delete product with inventory. Please remove inventory first.",
      );
    }

    await db.delete(products).where(eq(products.id, productId));

    return { message: "Product deleted successfully" };
  }
}
