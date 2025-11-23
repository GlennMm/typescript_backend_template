import { and, eq, lt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import {
  branchInventory,
  branches,
  inventoryTransfers,
  products,
} from "../../db/schemas/tenant.schema";
import type {
  AdjustInventoryDto,
  ApproveTransferDto,
  CreateTransferDto,
  SetInventoryDto,
} from "./inventory.validation";

export class InventoryService {
  // Branch Inventory Methods

  async getBranchInventory(tenantId: string, branchId: string) {
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

    const inventory = await db
      .select({
        id: branchInventory.id,
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        unit: products.unit,
        quantity: branchInventory.quantity,
        minimumStock: branchInventory.minimumStock,
        maximumStock: branchInventory.maximumStock,
        lastRestocked: branchInventory.lastRestocked,
        updatedAt: branchInventory.updatedAt,
      })
      .from(branchInventory)
      .innerJoin(products, eq(branchInventory.productId, products.id))
      .where(eq(branchInventory.branchId, branchId))
      .orderBy(products.name);

    return inventory;
  }

  async getProductInventoryAtBranch(
    tenantId: string,
    branchId: string,
    productId: string,
  ) {
    const db = getTenantDb(tenantId);

    const [inventory] = await db
      .select({
        id: branchInventory.id,
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        unit: products.unit,
        quantity: branchInventory.quantity,
        minimumStock: branchInventory.minimumStock,
        maximumStock: branchInventory.maximumStock,
        lastRestocked: branchInventory.lastRestocked,
        updatedAt: branchInventory.updatedAt,
      })
      .from(branchInventory)
      .innerJoin(products, eq(branchInventory.productId, products.id))
      .where(
        and(
          eq(branchInventory.branchId, branchId),
          eq(branchInventory.productId, productId),
        ),
      )
      .limit(1);

    if (!inventory) {
      // Return zero inventory if not found
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        throw new Error("Product not found");
      }

      return {
        id: null,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unit: product.unit,
        quantity: 0,
        minimumStock: 0,
        maximumStock: null,
        lastRestocked: null,
        updatedAt: null,
      };
    }

    return inventory;
  }

  async adjustInventory(
    tenantId: string,
    branchId: string,
    dto: AdjustInventoryDto,
  ) {
    const db = getTenantDb(tenantId);

    // Verify branch and product exist
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, dto.productId))
      .limit(1);

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if inventory record exists
    const [existingInventory] = await db
      .select()
      .from(branchInventory)
      .where(
        and(
          eq(branchInventory.branchId, branchId),
          eq(branchInventory.productId, dto.productId),
        ),
      )
      .limit(1);

    if (existingInventory) {
      // Update existing inventory
      const newQuantity = existingInventory.quantity + dto.quantity;

      if (newQuantity < 0) {
        throw new Error("Insufficient inventory");
      }

      const [updated] = await db
        .update(branchInventory)
        .set({
          quantity: newQuantity,
          lastRestocked: dto.quantity > 0 ? new Date() : existingInventory.lastRestocked,
          updatedAt: new Date(),
        })
        .where(eq(branchInventory.id, existingInventory.id))
        .returning();

      return updated;
    }

    // Create new inventory record
    if (dto.quantity < 0) {
      throw new Error("Cannot create negative inventory");
    }

    const [newInventory] = await db
      .insert(branchInventory)
      .values({
        id: nanoid(),
        productId: dto.productId,
        branchId,
        quantity: dto.quantity,
        minimumStock: 0,
        lastRestocked: dto.quantity > 0 ? new Date() : null,
      })
      .returning();

    return newInventory;
  }

  async setInventory(
    tenantId: string,
    branchId: string,
    dto: SetInventoryDto,
  ) {
    const db = getTenantDb(tenantId);

    // Verify branch and product exist
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, dto.productId))
      .limit(1);

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if inventory record exists
    const [existingInventory] = await db
      .select()
      .from(branchInventory)
      .where(
        and(
          eq(branchInventory.branchId, branchId),
          eq(branchInventory.productId, dto.productId),
        ),
      )
      .limit(1);

    if (existingInventory) {
      // Update existing inventory
      const [updated] = await db
        .update(branchInventory)
        .set({
          quantity: dto.quantity,
          minimumStock: dto.minimumStock ?? existingInventory.minimumStock,
          maximumStock: dto.maximumStock ?? existingInventory.maximumStock,
          lastRestocked: dto.quantity > existingInventory.quantity ? new Date() : existingInventory.lastRestocked,
          updatedAt: new Date(),
        })
        .where(eq(branchInventory.id, existingInventory.id))
        .returning();

      return updated;
    }

    // Create new inventory record
    const [newInventory] = await db
      .insert(branchInventory)
      .values({
        id: nanoid(),
        productId: dto.productId,
        branchId,
        quantity: dto.quantity,
        minimumStock: dto.minimumStock ?? 0,
        maximumStock: dto.maximumStock ?? null,
        lastRestocked: dto.quantity > 0 ? new Date() : null,
      })
      .returning();

    return newInventory;
  }

  async getLowStockItems(tenantId: string, branchId: string) {
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

    const lowStockItems = await db
      .select({
        id: branchInventory.id,
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        unit: products.unit,
        quantity: branchInventory.quantity,
        minimumStock: branchInventory.minimumStock,
        difference: sql<number>`${branchInventory.minimumStock} - ${branchInventory.quantity}`,
      })
      .from(branchInventory)
      .innerJoin(products, eq(branchInventory.productId, products.id))
      .where(
        and(
          eq(branchInventory.branchId, branchId),
          lt(branchInventory.quantity, branchInventory.minimumStock),
        ),
      )
      .orderBy(sql`${branchInventory.minimumStock} - ${branchInventory.quantity} DESC`);

    return lowStockItems;
  }

  // Inventory Transfer Methods

  async getAllTransfers(tenantId: string, branchId?: string) {
    const db = getTenantDb(tenantId);

    let query = db
      .select({
        id: inventoryTransfers.id,
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        fromBranchId: inventoryTransfers.fromBranchId,
        fromBranchName: sql<string>`from_branch.name`,
        toBranchId: inventoryTransfers.toBranchId,
        toBranchName: sql<string>`to_branch.name`,
        quantity: inventoryTransfers.quantity,
        status: inventoryTransfers.status,
        notes: inventoryTransfers.notes,
        requestedBy: inventoryTransfers.requestedBy,
        approvedBy: inventoryTransfers.approvedBy,
        requestedAt: inventoryTransfers.requestedAt,
        approvedAt: inventoryTransfers.approvedAt,
        completedAt: inventoryTransfers.completedAt,
      })
      .from(inventoryTransfers)
      .innerJoin(products, eq(inventoryTransfers.productId, products.id))
      .innerJoin(
        branches,
        eq(inventoryTransfers.fromBranchId, branches.id),
      )
      .innerJoin(
        sql`branches AS to_branch`,
        eq(inventoryTransfers.toBranchId, sql`to_branch.id`),
      );

    if (branchId) {
      query = query.where(
        sql`${inventoryTransfers.fromBranchId} = ${branchId} OR ${inventoryTransfers.toBranchId} = ${branchId}`,
      );
    }

    const transfers = await query.orderBy(sql`${inventoryTransfers.requestedAt} DESC`);

    return transfers;
  }

  async getTransferById(tenantId: string, transferId: string) {
    const db = getTenantDb(tenantId);

    const [transfer] = await db
      .select()
      .from(inventoryTransfers)
      .where(eq(inventoryTransfers.id, transferId))
      .limit(1);

    if (!transfer) {
      throw new Error("Transfer not found");
    }

    return transfer;
  }

  async createTransfer(
    tenantId: string,
    dto: CreateTransferDto,
    requestedBy: string,
  ) {
    const db = getTenantDb(tenantId);

    // Verify branches exist
    const [fromBranch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, dto.fromBranchId))
      .limit(1);

    const [toBranch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, dto.toBranchId))
      .limit(1);

    if (!fromBranch || !toBranch) {
      throw new Error("One or both branches not found");
    }

    if (dto.fromBranchId === dto.toBranchId) {
      throw new Error("Cannot transfer to the same branch");
    }

    // Verify product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, dto.productId))
      .limit(1);

    if (!product) {
      throw new Error("Product not found");
    }

    // Check inventory availability at source branch
    const [sourceInventory] = await db
      .select()
      .from(branchInventory)
      .where(
        and(
          eq(branchInventory.branchId, dto.fromBranchId),
          eq(branchInventory.productId, dto.productId),
        ),
      )
      .limit(1);

    if (!sourceInventory || sourceInventory.quantity < dto.quantity) {
      throw new Error("Insufficient inventory at source branch");
    }

    const [newTransfer] = await db
      .insert(inventoryTransfers)
      .values({
        id: nanoid(),
        productId: dto.productId,
        fromBranchId: dto.fromBranchId,
        toBranchId: dto.toBranchId,
        quantity: dto.quantity,
        status: "pending",
        notes: dto.notes || null,
        requestedBy,
      })
      .returning();

    return newTransfer;
  }

  async approveTransfer(
    tenantId: string,
    transferId: string,
    dto: ApproveTransferDto,
    approvedBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const [transfer] = await db
      .select()
      .from(inventoryTransfers)
      .where(eq(inventoryTransfers.id, transferId))
      .limit(1);

    if (!transfer) {
      throw new Error("Transfer not found");
    }

    if (transfer.status !== "pending") {
      throw new Error("Transfer is not pending approval");
    }

    const newStatus = dto.approved ? "approved" : "rejected";

    const [updated] = await db
      .update(inventoryTransfers)
      .set({
        status: newStatus,
        approvedBy,
        approvedAt: new Date(),
        notes: dto.notes || transfer.notes,
      })
      .where(eq(inventoryTransfers.id, transferId))
      .returning();

    return updated;
  }

  async completeTransfer(tenantId: string, transferId: string) {
    const db = getTenantDb(tenantId);

    const [transfer] = await db
      .select()
      .from(inventoryTransfers)
      .where(eq(inventoryTransfers.id, transferId))
      .limit(1);

    if (!transfer) {
      throw new Error("Transfer not found");
    }

    if (transfer.status !== "approved") {
      throw new Error("Transfer must be approved before completion");
    }

    // Deduct from source branch
    const [sourceInventory] = await db
      .select()
      .from(branchInventory)
      .where(
        and(
          eq(branchInventory.branchId, transfer.fromBranchId),
          eq(branchInventory.productId, transfer.productId),
        ),
      )
      .limit(1);

    if (!sourceInventory || sourceInventory.quantity < transfer.quantity) {
      throw new Error("Insufficient inventory at source branch");
    }

    await db
      .update(branchInventory)
      .set({
        quantity: sourceInventory.quantity - transfer.quantity,
        updatedAt: new Date(),
      })
      .where(eq(branchInventory.id, sourceInventory.id));

    // Add to destination branch
    const [destInventory] = await db
      .select()
      .from(branchInventory)
      .where(
        and(
          eq(branchInventory.branchId, transfer.toBranchId),
          eq(branchInventory.productId, transfer.productId),
        ),
      )
      .limit(1);

    if (destInventory) {
      await db
        .update(branchInventory)
        .set({
          quantity: destInventory.quantity + transfer.quantity,
          lastRestocked: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(branchInventory.id, destInventory.id));
    } else {
      await db.insert(branchInventory).values({
        id: nanoid(),
        productId: transfer.productId,
        branchId: transfer.toBranchId,
        quantity: transfer.quantity,
        minimumStock: 0,
        lastRestocked: new Date(),
      });
    }

    // Mark transfer as completed
    const [completed] = await db
      .update(inventoryTransfers)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(inventoryTransfers.id, transferId))
      .returning();

    return completed;
  }
}
