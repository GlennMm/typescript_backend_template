import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { taxes, productBranchTaxes } from "../../db/schemas/tenant.schema";
import { getTenantDb } from "@/db/connection";

interface CreateTaxDto {
  name: string;
  taxRate: number;
  taxCode?: string;
  taxID?: string;
}

interface UpdateTaxDto {
  name?: string;
  taxRate?: number;
  taxCode?: string;
  taxID?: string;
  isActive?: boolean;
}

interface AssignTaxToProductDto {
  productId: string;
  branchId: string;
  taxId: string;
}

export class TaxesService {
  async getAllTaxes(tenantId: string) {
    const db = getTenantDb(tenantId);
    return await db.select().from(taxes).orderBy(taxes.name);
  }

  async getTaxById(tenantId: string, id: string) {
    const db = getTenantDb(tenantId);

    const [tax] = await db
      .select()
      .from(taxes)
      .where(eq(taxes.id, id))
      .limit(1);

    if (!tax) {
      throw new Error("Tax not found");
    }

    return tax;
  }

  async createTax(tenantId: string, dto: CreateTaxDto) {
    const db = getTenantDb(tenantId);

    const [newTax] = await db
      .insert(taxes)
      .values({
        id: nanoid(),
        name: dto.name,
        taxRate: dto.taxRate,
        taxCode: dto.taxCode,
        taxID: dto.taxID,
      })
      .returning();

    return newTax;
  }

  async updateTax(tenantId: string, id: string, dto: UpdateTaxDto) {
    const db = getTenantDb(tenantId);

    // Check if tax exists
    await this.getTaxById(tenantId, id);

    const [updated] = await db
      .update(taxes)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(taxes.id, id))
      .returning();

    return updated;
  }

  async deleteTax(tenantId: string, id: string) {
    const db = getTenantDb(tenantId);

    // Check if tax exists
    await this.getTaxById(tenantId, id);

    // Delete the tax (cascade will remove product-tax assignments)
    await db.delete(taxes).where(eq(taxes.id, id));
  }

  // Assign tax to a product at a specific branch
  async assignTaxToProduct(tenantId: string, dto: AssignTaxToProductDto) {
    const db = getTenantDb(tenantId);

    // Check if tax exists
    await this.getTaxById(tenantId, dto.taxId);

    // Check if assignment already exists
    const [existing] = await db
      .select()
      .from(productBranchTaxes)
      .where(
        eq(productBranchTaxes.productId, dto.productId) &&
          eq(productBranchTaxes.branchId, dto.branchId) &&
          eq(productBranchTaxes.taxId, dto.taxId),
      )
      .limit(1);

    if (existing) {
      throw new Error("Tax is already assigned to this product at this branch");
    }

    const [assignment] = await db
      .insert(productBranchTaxes)
      .values({
        id: nanoid(),
        productId: dto.productId,
        branchId: dto.branchId,
        taxId: dto.taxId,
      })
      .returning();

    return assignment;
  }

  // Remove tax from a product at a specific branch
  async removeTaxFromProduct(
    tenantId: string,
    productId: string,
    branchId: string,
    taxId: string,
  ) {
    const db = getTenantDb(tenantId);

    await db
      .delete(productBranchTaxes)
      .where(
        eq(productBranchTaxes.productId, productId) &&
          eq(productBranchTaxes.branchId, branchId) &&
          eq(productBranchTaxes.taxId, taxId),
      );
  }

  // Get all taxes assigned to a product at a specific branch
  async getProductBranchTaxes(
    tenantId: string,
    productId: string,
    branchId: string,
  ) {
    const db = getTenantDb(tenantId);

    const productTaxes = await db
      .select({
        id: productBranchTaxes.id,
        productId: productBranchTaxes.productId,
        branchId: productBranchTaxes.branchId,
        taxId: productBranchTaxes.taxId,
        taxName: taxes.name,
        taxRate: taxes.taxRate,
        taxCode: taxes.taxCode,
        taxID: taxes.taxID,
        createdAt: productBranchTaxes.createdAt,
      })
      .from(productBranchTaxes)
      .innerJoin(taxes, eq(productBranchTaxes.taxId, taxes.id))
      .where(
        eq(productBranchTaxes.productId, productId) &&
          eq(productBranchTaxes.branchId, branchId),
      );

    return productTaxes;
  }
}
