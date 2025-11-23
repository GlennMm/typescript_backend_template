import { and, eq, sql, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import {
  quotations,
  quotationItems,
  products,
  customers,
  branches,
  branchDiscounts,
  sales,
} from "../../db/schemas/tenant.schema";
import { SettingsService } from "./settings.service";
import { SalesService } from "./sales.service";

interface CreateQuotationDto {
  branchId: string;
  customerId: string;
  quotationDate?: Date;
  validityDays?: number; // Override settings if provided
  notes?: string;
  saleDiscountId?: string;
  items: {
    productId: string;
    quantity: number;
    discountId?: string;
  }[];
}

interface UpdateQuotationDto {
  customerId?: string;
  quotationDate?: Date;
  validityDays?: number;
  notes?: string;
  saleDiscountId?: string;
  items?: {
    productId: string;
    quantity: number;
    discountId?: string;
  }[];
}

export class QuotationsService {
  private settingsService: SettingsService;
  private salesService: SalesService;

  constructor() {
    this.settingsService = new SettingsService();
    this.salesService = new SalesService();
  }

  // Generate unique quotation number
  private async generateQuotationNumber(tenantId: string): Promise<string> {
    const db = getTenantDb(tenantId);
    const year = new Date().getFullYear();
    const prefix = `QT${year}`;

    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(sql`${quotations.quotationNumber} LIKE ${prefix + "%"}`);

    const nextNumber = (count[0]?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, "0")}`;
  }

  // Calculate totals (similar to sales)
  private async calculateTotals(
    tenantId: string,
    branchId: string,
    items: {
      price: number;
      quantity: number;
      discount: { percentage: number } | null;
    }[],
    saleDiscount: { percentage: number } | null,
  ) {
    const settings = await this.settingsService.getBranchSettings(
      tenantId,
      branchId,
    );

    const lineItems = items.map((item) => {
      const lineSubtotal = item.price * item.quantity;
      const discountPercentage = item.discount?.percentage || 0;
      const discountAmount = (lineSubtotal * discountPercentage) / 100;
      const lineTotal = lineSubtotal - discountAmount;

      return {
        lineSubtotal,
        discountPercentage,
        discountAmount,
        lineTotal,
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const saleDiscountPercentage = saleDiscount?.percentage || 0;
    const saleDiscountAmount = (subtotal * saleDiscountPercentage) / 100;
    const discountedSubtotal = subtotal - saleDiscountAmount;

    let taxAmount = 0;
    let finalTotal = discountedSubtotal;

    if (settings.taxMode === "inclusive") {
      taxAmount =
        discountedSubtotal - discountedSubtotal / (1 + settings.taxRate / 100);
    } else {
      taxAmount = (discountedSubtotal * settings.taxRate) / 100;
      finalTotal = discountedSubtotal + taxAmount;
    }

    return {
      lineItems,
      subtotal,
      saleDiscountPercentage,
      saleDiscountAmount,
      taxMode: settings.taxMode,
      taxRate: settings.taxRate,
      taxAmount,
      total: finalTotal,
    };
  }

  // Check and update quotation expiry
  private async checkExpiry(tenantId: string, quotationId: string) {
    const db = getTenantDb(tenantId);

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId))
      .limit(1);

    if (!quotation) {
      return null;
    }

    // Check if expired
    if (
      quotation.status === "sent" &&
      quotation.expiryDate &&
      new Date() > quotation.expiryDate
    ) {
      // Mark as expired
      await db
        .update(quotations)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(quotations.id, quotationId));

      quotation.status = "expired";
    }

    return quotation;
  }

  // Create quotation
  async createQuotation(
    tenantId: string,
    dto: CreateQuotationDto,
    createdBy: string,
  ) {
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

    // Verify customer exists
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, dto.customerId))
      .limit(1);

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Get validity days (from dto, branch settings, or tenant settings)
    let validityDays = dto.validityDays;
    if (!validityDays) {
      const settings = await this.settingsService.getBranchSettings(
        tenantId,
        dto.branchId,
      );
      validityDays = settings.quotationValidityDays;
    }

    // Calculate expiry date
    const quotationDate = dto.quotationDate || new Date();
    const expiryDate = new Date(quotationDate);
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    // Verify products and get prices
    const productData: Array<{
      id: string;
      price: number;
      quantity: number;
      discountId?: string;
    }> = [];

    for (const item of dto.items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product || !product.isActive) {
        throw new Error(`Product not found or inactive: ${item.productId}`);
      }

      productData.push({
        id: product.id,
        price: product.price,
        quantity: item.quantity,
        discountId: item.discountId,
      });
    }

    // Get discounts
    const discountMap = new Map();
    const discountIds = [
      ...productData.map((p) => p.discountId).filter(Boolean),
      dto.saleDiscountId,
    ].filter(Boolean) as string[];

    if (discountIds.length > 0) {
      const discounts = await db
        .select()
        .from(branchDiscounts)
        .where(
          and(
            sql`${branchDiscounts.id} IN ${sql.join(discountIds, sql.raw(","))}`,
            eq(branchDiscounts.isActive, true),
          ),
        );

      discounts.forEach((d) => discountMap.set(d.id, d));
    }

    const saleDiscount = dto.saleDiscountId
      ? discountMap.get(dto.saleDiscountId)
      : null;

    // Calculate totals
    const itemsForCalc = productData.map((p) => ({
      price: p.price,
      quantity: p.quantity,
      discount: p.discountId ? discountMap.get(p.discountId) : null,
    }));

    const totals = await this.calculateTotals(
      tenantId,
      dto.branchId,
      itemsForCalc,
      saleDiscount,
    );

    // Generate quotation number
    const quotationNumber = await this.generateQuotationNumber(tenantId);

    // Create quotation
    const [quotation] = await db
      .insert(quotations)
      .values({
        id: nanoid(),
        quotationNumber,
        branchId: dto.branchId,
        customerId: dto.customerId,
        quotationDate,
        validityDays,
        expiryDate,
        subtotal: totals.subtotal,
        saleDiscountId: dto.saleDiscountId,
        saleDiscountPercentage: totals.saleDiscountPercentage,
        discountAmount: totals.saleDiscountAmount,
        taxMode: totals.taxMode,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        status: "draft",
        notes: dto.notes,
        createdBy,
      })
      .returning();

    // Create items
    for (let i = 0; i < productData.length; i++) {
      const product = productData[i];
      const lineCalc = totals.lineItems[i];

      await db.insert(quotationItems).values({
        id: nanoid(),
        quotationId: quotation.id,
        productId: product.id,
        quantity: product.quantity,
        price: product.price,
        discountId: product.discountId,
        discountPercentage: lineCalc.discountPercentage,
        discountAmount: lineCalc.discountAmount,
        lineTotal: lineCalc.lineTotal,
      });
    }

    return await this.getQuotationById(tenantId, quotation.id);
  }

  // Send quotation
  async sendQuotation(tenantId: string, quotationId: string, sentBy: string) {
    const db = getTenantDb(tenantId);

    const quotation = await this.getQuotationById(tenantId, quotationId);

    if (quotation.status !== "draft") {
      throw new Error("Only draft quotations can be sent");
    }

    const [updated] = await db
      .update(quotations)
      .set({
        status: "sent",
        sentBy,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId))
      .returning();

    return await this.getQuotationById(tenantId, updated.id);
  }

  // Convert quotation to credit sale
  async convertToSale(
    tenantId: string,
    quotationId: string,
    convertedBy: string,
  ) {
    const db = getTenantDb(tenantId);

    // Get quotation
    const quotation = await this.getQuotationById(tenantId, quotationId);

    // Check expiry
    await this.checkExpiry(tenantId, quotationId);
    const refreshed = await this.getQuotationById(tenantId, quotationId);

    if (refreshed.status === "expired") {
      throw new Error(
        "Quotation has expired. Please recreate with updated prices",
      );
    }

    if (refreshed.status !== "sent") {
      throw new Error("Only sent quotations can be converted");
    }

    // Create sale using same items and prices
    const sale = await this.salesService.createCreditSale(
      tenantId,
      {
        branchId: quotation.branchId,
        customerId: quotation.customerId,
        saleDate: new Date(),
        notes: `Converted from quotation ${quotation.quotationNumber}${quotation.notes ? `. Original notes: ${quotation.notes}` : ""}`,
        saleDiscountId: quotation.saleDiscountId || undefined,
        items: quotation.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          discountId: item.discountId || undefined,
        })),
      },
      convertedBy,
    );

    // Mark quotation as accepted and linked to sale
    await db
      .update(quotations)
      .set({
        status: "accepted",
        convertedToSaleId: sale.id,
        convertedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId));

    return sale;
  }

  // Convert quotation to layby (will be implemented in LaybysService)
  async convertToLayby(
    tenantId: string,
    quotationId: string,
    convertedBy: string,
  ) {
    // This will be called from LaybysService
    // Just mark quotation as accepted for now
    const db = getTenantDb(tenantId);

    await db
      .update(quotations)
      .set({
        status: "accepted",
        convertedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId));
  }

  // Recreate expired quotation with updated prices
  async recreateQuotation(
    tenantId: string,
    quotationId: string,
    createdBy: string,
  ) {
    const db = getTenantDb(tenantId);

    // Get expired quotation
    const expired = await this.getQuotationById(tenantId, quotationId);

    if (expired.status !== "expired") {
      throw new Error("Only expired quotations can be recreated");
    }

    // Create new quotation with current prices
    return await this.createQuotation(
      tenantId,
      {
        branchId: expired.branchId,
        customerId: expired.customerId,
        notes: `Recreated from expired quotation ${expired.quotationNumber}${expired.notes ? `. Original notes: ${expired.notes}` : ""}`,
        saleDiscountId: expired.saleDiscountId || undefined,
        items: expired.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          discountId: item.discountId || undefined,
        })),
      },
      createdBy,
    );
  }

  // Reject quotation
  async rejectQuotation(
    tenantId: string,
    quotationId: string,
    reason?: string,
  ) {
    const db = getTenantDb(tenantId);

    const quotation = await this.getQuotationById(tenantId, quotationId);

    if (!["draft", "sent"].includes(quotation.status)) {
      throw new Error("Only draft or sent quotations can be rejected");
    }

    const notes = reason
      ? `${quotation.notes ? quotation.notes + ". " : ""}Rejection reason: ${reason}`
      : quotation.notes;

    const [updated] = await db
      .update(quotations)
      .set({
        status: "rejected",
        notes,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId))
      .returning();

    return await this.getQuotationById(tenantId, updated.id);
  }

  // Update quotation (only draft)
  async updateQuotation(
    tenantId: string,
    quotationId: string,
    dto: UpdateQuotationDto,
  ) {
    const db = getTenantDb(tenantId);

    const quotation = await this.getQuotationById(tenantId, quotationId);

    if (quotation.status !== "draft") {
      throw new Error("Only draft quotations can be updated");
    }

    // Similar to sales update logic
    if (dto.items) {
      await db
        .delete(quotationItems)
        .where(eq(quotationItems.quotationId, quotationId));

      const productData: Array<{
        id: string;
        price: number;
        quantity: number;
        discountId?: string;
      }> = [];

      for (const item of dto.items) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product || !product.isActive) {
          throw new Error(`Product not found or inactive: ${item.productId}`);
        }

        productData.push({
          id: product.id,
          price: product.price,
          quantity: item.quantity,
          discountId: item.discountId,
        });
      }

      const discountMap = new Map();
      const discountIds = [
        ...productData.map((p) => p.discountId).filter(Boolean),
        dto.saleDiscountId || quotation.saleDiscountId,
      ].filter(Boolean) as string[];

      if (discountIds.length > 0) {
        const discounts = await db
          .select()
          .from(branchDiscounts)
          .where(
            and(
              sql`${branchDiscounts.id} IN ${sql.join(discountIds, sql.raw(","))}`,
              eq(branchDiscounts.isActive, true),
            ),
          );

        discounts.forEach((d) => discountMap.set(d.id, d));
      }

      const saleDiscountId = dto.saleDiscountId || quotation.saleDiscountId;
      const saleDiscount = saleDiscountId
        ? discountMap.get(saleDiscountId)
        : null;

      const itemsForCalc = productData.map((p) => ({
        price: p.price,
        quantity: p.quantity,
        discount: p.discountId ? discountMap.get(p.discountId) : null,
      }));

      const totals = await this.calculateTotals(
        tenantId,
        quotation.branchId,
        itemsForCalc,
        saleDiscount,
      );

      // Calculate new expiry date if validity changed
      const validityDays = dto.validityDays || quotation.validityDays;
      const quotationDate = dto.quotationDate || quotation.quotationDate;
      const expiryDate = new Date(quotationDate);
      expiryDate.setDate(expiryDate.getDate() + validityDays);

      await db
        .update(quotations)
        .set({
          customerId: dto.customerId,
          quotationDate,
          validityDays,
          expiryDate,
          notes: dto.notes,
          saleDiscountId,
          subtotal: totals.subtotal,
          saleDiscountPercentage: totals.saleDiscountPercentage,
          discountAmount: totals.saleDiscountAmount,
          taxAmount: totals.taxAmount,
          total: totals.total,
          updatedAt: new Date(),
        })
        .where(eq(quotations.id, quotationId));

      for (let i = 0; i < productData.length; i++) {
        const product = productData[i];
        const lineCalc = totals.lineItems[i];

        await db.insert(quotationItems).values({
          id: nanoid(),
          quotationId: quotation.id,
          productId: product.id,
          quantity: product.quantity,
          price: product.price,
          discountId: product.discountId,
          discountPercentage: lineCalc.discountPercentage,
          discountAmount: lineCalc.discountAmount,
          lineTotal: lineCalc.lineTotal,
        });
      }
    } else {
      await db
        .update(quotations)
        .set({
          customerId: dto.customerId,
          quotationDate: dto.quotationDate,
          notes: dto.notes,
          updatedAt: new Date(),
        })
        .where(eq(quotations.id, quotationId));
    }

    return await this.getQuotationById(tenantId, quotationId);
  }

  // Get quotation by ID
  async getQuotationById(tenantId: string, quotationId: string) {
    const db = getTenantDb(tenantId);

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId))
      .limit(1);

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    // Get items
    const items = await db
      .select({
        id: quotationItems.id,
        productId: quotationItems.productId,
        productName: products.name,
        productSku: products.sku,
        quantity: quotationItems.quantity,
        price: quotationItems.price,
        discountId: quotationItems.discountId,
        discountPercentage: quotationItems.discountPercentage,
        discountAmount: quotationItems.discountAmount,
        lineTotal: quotationItems.lineTotal,
      })
      .from(quotationItems)
      .leftJoin(products, eq(quotationItems.productId, products.id))
      .where(eq(quotationItems.quotationId, quotationId));

    return {
      ...quotation,
      items,
    };
  }

  // Get all quotations
  async getAllQuotations(
    tenantId: string,
    filters: {
      branchId?: string;
      customerId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const db = getTenantDb(tenantId);

    const conditions = [];

    if (filters.branchId) {
      conditions.push(eq(quotations.branchId, filters.branchId));
    }

    if (filters.customerId) {
      conditions.push(eq(quotations.customerId, filters.customerId));
    }

    if (filters.status) {
      conditions.push(eq(quotations.status, filters.status as any));
    }

    if (filters.startDate) {
      conditions.push(gte(quotations.quotationDate, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(quotations.quotationDate, filters.endDate));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: quotations.id,
        quotationNumber: quotations.quotationNumber,
        branchId: quotations.branchId,
        branchName: branches.name,
        customerId: quotations.customerId,
        customerName: customers.name,
        quotationDate: quotations.quotationDate,
        expiryDate: quotations.expiryDate,
        validityDays: quotations.validityDays,
        subtotal: quotations.subtotal,
        discountAmount: quotations.discountAmount,
        taxAmount: quotations.taxAmount,
        total: quotations.total,
        status: quotations.status,
        notes: quotations.notes,
        convertedToSaleId: quotations.convertedToSaleId,
        convertedToLaybyId: quotations.convertedToLaybyId,
        createdBy: quotations.createdBy,
        createdAt: quotations.createdAt,
      })
      .from(quotations)
      .leftJoin(branches, eq(quotations.branchId, branches.id))
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .where(where)
      .orderBy(sql`${quotations.quotationDate} DESC`);

    // Check expiry for each
    for (const q of results) {
      if (q.status === "sent" && q.expiryDate && new Date() > q.expiryDate) {
        await this.checkExpiry(tenantId, q.id);
        q.status = "expired";
      }
    }

    return results;
  }
}
