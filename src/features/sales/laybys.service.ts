import { and, eq, sql, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import {
  laybys,
  laybyItems,
  payments,
  products,
  customers,
  branches,
  branchInventory,
  branchDiscounts,
  currencies,
  paymentMethods,
  quotations,
} from "../../db/schemas/tenant.schema";
import { SettingsService } from "./settings.service";
import { CustomersService } from "./customers.service";

interface CreateLaybyDto {
  branchId: string;
  customerId: string;
  laybyDate?: Date;
  notes?: string;
  saleDiscountId?: string;
  items: {
    productId: string;
    quantity: number;
    discountId?: string;
  }[];
}

interface UpdateLaybyDto {
  customerId?: string;
  laybyDate?: Date;
  notes?: string;
  saleDiscountId?: string;
  items?: {
    productId: string;
    quantity: number;
    discountId?: string;
  }[];
}

interface AddPaymentDto {
  amount: number;
  currencyId: string;
  paymentMethodId: string;
  paymentDate?: Date;
  referenceNumber?: string;
  notes?: string;
}

interface CancelLaybyDto {
  reason: string;
}

export class LaybysService {
  private settingsService: SettingsService;
  private customersService: CustomersService;

  constructor() {
    this.settingsService = new SettingsService();
    this.customersService = new CustomersService();
  }

  // Generate unique layby number
  private async generateLaybyNumber(tenantId: string): Promise<string> {
    const db = getTenantDb(tenantId);
    const year = new Date().getFullYear();
    const prefix = `LB${year}`;

    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(laybys)
      .where(sql`${laybys.laybyNumber} LIKE ${prefix + "%"}`);

    const nextNumber = (count[0]?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, "0")}`;
  }

  // Generate unique receipt number
  private async generateReceiptNumber(tenantId: string): Promise<string> {
    const db = getTenantDb(tenantId);
    const year = new Date().getFullYear();
    const prefix = `RCP${year}`;

    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(sql`${payments.receiptNumber} LIKE ${prefix + "%"}`);

    const nextNumber = (count[0]?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, "0")}`;
  }

  // Calculate totals
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
      depositRequired: settings.laybyDeposit,
      cancellationFee: settings.cancellationFee,
    };
  }

  // Reserve stock
  private async reserveStock(
    tenantId: string,
    branchId: string,
    laybyId: string,
    items: { productId: string; quantity: number; itemId: string }[],
  ) {
    const db = getTenantDb(tenantId);

    for (const item of items) {
      // Get current inventory
      const [inventory] = await db
        .select()
        .from(branchInventory)
        .where(
          and(
            eq(branchInventory.branchId, branchId),
            eq(branchInventory.productId, item.productId),
          ),
        )
        .limit(1);

      if (!inventory) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);
        throw new Error(
          `No inventory record found for product: ${product?.name || item.productId}`,
        );
      }

      if (inventory.quantity < item.quantity) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);
        throw new Error(
          `Insufficient stock for product: ${product?.name || item.productId}. Available: ${inventory.quantity}, Required: ${item.quantity}`,
        );
      }

      // Reserve stock (deduct from available quantity)
      await db
        .update(branchInventory)
        .set({
          quantity: inventory.quantity - item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(branchInventory.id, inventory.id));

      // Mark item as reserved
      await db
        .update(laybyItems)
        .set({
          stockReserved: true,
          stockReservedAt: new Date(),
        })
        .where(eq(laybyItems.id, item.itemId));
    }
  }

  // Return stock (on cancellation)
  private async returnStock(
    tenantId: string,
    branchId: string,
    items: { productId: string; quantity: number; stockReserved: boolean }[],
  ) {
    const db = getTenantDb(tenantId);

    for (const item of items) {
      if (!item.stockReserved) {
        continue; // Stock was never reserved
      }

      // Get current inventory
      const [inventory] = await db
        .select()
        .from(branchInventory)
        .where(
          and(
            eq(branchInventory.branchId, branchId),
            eq(branchInventory.productId, item.productId),
          ),
        )
        .limit(1);

      if (inventory) {
        // Return stock
        await db
          .update(branchInventory)
          .set({
            quantity: inventory.quantity + item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(branchInventory.id, inventory.id));
      }
    }
  }

  // Create layby (draft)
  async createLayby(tenantId: string, dto: CreateLaybyDto, createdBy: string) {
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
    const customer = await this.customersService.getCustomerById(
      tenantId,
      dto.customerId,
    );

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

    // Generate layby number
    const laybyNumber = await this.generateLaybyNumber(tenantId);

    // Create layby
    const [layby] = await db
      .insert(laybys)
      .values({
        id: nanoid(),
        laybyNumber,
        branchId: dto.branchId,
        customerId: dto.customerId,
        laybyDate: dto.laybyDate || new Date(),
        subtotal: totals.subtotal,
        saleDiscountId: dto.saleDiscountId,
        saleDiscountPercentage: totals.saleDiscountPercentage,
        discountAmount: totals.saleDiscountAmount,
        taxMode: totals.taxMode,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        depositRequired: totals.depositRequired,
        amountPaid: 0,
        amountDue: totals.total,
        status: "draft",
        cancellationFee: totals.cancellationFee,
        notes: dto.notes,
        createdBy,
      })
      .returning();

    // Create layby items
    for (let i = 0; i < productData.length; i++) {
      const product = productData[i];
      const lineCalc = totals.lineItems[i];

      await db.insert(laybyItems).values({
        id: nanoid(),
        laybyId: layby.id,
        productId: product.id,
        quantity: product.quantity,
        price: product.price,
        discountId: product.discountId,
        discountPercentage: lineCalc.discountPercentage,
        discountAmount: lineCalc.discountAmount,
        lineTotal: lineCalc.lineTotal,
        stockReserved: false,
      });
    }

    return await this.getLaybyById(tenantId, layby.id);
  }

  // Create layby from quotation
  async createFromQuotation(
    tenantId: string,
    quotationId: string,
    createdBy: string,
  ) {
    const db = getTenantDb(tenantId);

    // Get quotation
    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId))
      .limit(1);

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    if (quotation.status !== "sent") {
      throw new Error("Only sent quotations can be converted");
    }

    // Get quotation items
    const quotationItemsList = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId));

    // Create layby
    const layby = await this.createLayby(
      tenantId,
      {
        branchId: quotation.branchId,
        customerId: quotation.customerId,
        notes: `Converted from quotation ${quotation.quotationNumber}`,
        saleDiscountId: quotation.saleDiscountId || undefined,
        items: quotationItemsList.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          discountId: item.discountId,
        })),
      },
      createdBy,
    );

    // Mark quotation as accepted
    await db
      .update(quotations)
      .set({
        status: "accepted",
        convertedToLaybyId: layby.id,
        convertedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId));

    return layby;
  }

  // Activate layby (reserve stock, transition draft → active)
  async activateLayby(tenantId: string, laybyId: string) {
    const db = getTenantDb(tenantId);

    const layby = await this.getLaybyById(tenantId, laybyId);

    if (layby.status !== "draft") {
      throw new Error("Only draft laybys can be activated");
    }

    // Reserve stock
    await this.reserveStock(
      tenantId,
      layby.branchId,
      laybyId,
      layby.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        itemId: item.id,
      })),
    );

    // Update status
    const [updated] = await db
      .update(laybys)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(laybys.id, laybyId))
      .returning();

    return await this.getLaybyById(tenantId, updated.id);
  }

  // Add payment to layby
  async addPayment(
    tenantId: string,
    laybyId: string,
    dto: AddPaymentDto,
    createdBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const layby = await this.getLaybyById(tenantId, laybyId);

    if (!["active", "partially_paid"].includes(layby.status)) {
      throw new Error("Can only add payments to active or partially paid laybys");
    }

    // Verify currency and payment method
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, dto.currencyId))
      .limit(1);

    if (!currency) {
      throw new Error("Currency not found");
    }

    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, dto.paymentMethodId))
      .limit(1);

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    // Calculate amount in base currency
    const amountInBaseCurrency = dto.amount * currency.exchangeRate;

    // Check if payment exceeds amount due
    if (amountInBaseCurrency > layby.amountDue + 0.01) {
      throw new Error(
        `Payment amount (${amountInBaseCurrency.toFixed(2)}) exceeds amount due (${layby.amountDue.toFixed(2)})`,
      );
    }

    // First payment must meet deposit requirement
    if (layby.amountPaid === 0 && amountInBaseCurrency < layby.depositRequired) {
      throw new Error(
        `First payment must be at least ${layby.depositRequired.toFixed(2)} (deposit required)`,
      );
    }

    // Generate receipt number
    const receiptNumber = await this.generateReceiptNumber(tenantId);

    // Create payment
    await db.insert(payments).values({
      id: nanoid(),
      receiptNumber,
      laybyId: layby.id,
      amount: dto.amount,
      currencyId: dto.currencyId,
      paymentMethodId: dto.paymentMethodId,
      exchangeRate: currency.exchangeRate,
      amountInBaseCurrency,
      referenceNumber: dto.referenceNumber,
      paymentDate: dto.paymentDate || new Date(),
      notes: dto.notes,
      createdBy,
    });

    // Update layby amounts
    const newAmountPaid = layby.amountPaid + amountInBaseCurrency;
    const newAmountDue = layby.total - newAmountPaid;

    // Determine new status
    let newStatus: "active" | "partially_paid" | "fully_paid" = layby.status as any;
    if (newAmountDue <= 0.01) {
      newStatus = "fully_paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partially_paid";
    }

    await db
      .update(laybys)
      .set({
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(laybys.id, laybyId));

    return await this.getLaybyById(tenantId, laybyId);
  }

  // Collect layby (mark as collected, stock already deducted on reservation)
  async collectLayby(tenantId: string, laybyId: string, collectedBy: string) {
    const db = getTenantDb(tenantId);

    const layby = await this.getLaybyById(tenantId, laybyId);

    if (layby.status !== "fully_paid") {
      throw new Error("Only fully paid laybys can be collected");
    }

    const [updated] = await db
      .update(laybys)
      .set({
        status: "collected",
        collectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(laybys.id, laybyId))
      .returning();

    // Update customer last purchase
    await this.customersService.updateLastPurchase(tenantId, layby.customerId);

    return await this.getLaybyById(tenantId, updated.id);
  }

  // Cancel layby (refund minus cancellation fee, return stock)
  async cancelLayby(
    tenantId: string,
    laybyId: string,
    dto: CancelLaybyDto,
    cancelledBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const layby = await this.getLaybyById(tenantId, laybyId);

    if (!["draft", "active", "partially_paid", "fully_paid"].includes(layby.status)) {
      throw new Error("Cannot cancel layby in current status");
    }

    // Calculate refund
    const refundAmount = Math.max(0, layby.amountPaid - (layby.cancellationFee || 0));

    // Return stock if it was reserved
    await this.returnStock(
      tenantId,
      layby.branchId,
      layby.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        stockReserved: item.stockReserved,
      })),
    );

    // Update layby
    const [updated] = await db
      .update(laybys)
      .set({
        status: "cancelled",
        cancellationReason: dto.reason,
        cancelledBy,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(laybys.id, laybyId))
      .returning();

    return {
      layby: await this.getLaybyById(tenantId, updated.id),
      refundAmount,
    };
  }

  // Update layby (only before first payment)
  async updateLayby(tenantId: string, laybyId: string, dto: UpdateLaybyDto) {
    const db = getTenantDb(tenantId);

    const layby = await this.getLaybyById(tenantId, laybyId);

    if (layby.amountPaid > 0) {
      throw new Error("Cannot update layby after first payment");
    }

    // Stock should not be reserved yet (still in draft)
    if (layby.status !== "draft") {
      throw new Error("Only draft laybys can be updated");
    }

    // Similar update logic to sales
    if (dto.items) {
      await db.delete(laybyItems).where(eq(laybyItems.laybyId, laybyId));

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
        dto.saleDiscountId || layby.saleDiscountId,
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

      const saleDiscountId = dto.saleDiscountId || layby.saleDiscountId;
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
        layby.branchId,
        itemsForCalc,
        saleDiscount,
      );

      await db
        .update(laybys)
        .set({
          customerId: dto.customerId,
          laybyDate: dto.laybyDate,
          notes: dto.notes,
          saleDiscountId,
          subtotal: totals.subtotal,
          saleDiscountPercentage: totals.saleDiscountPercentage,
          discountAmount: totals.saleDiscountAmount,
          taxAmount: totals.taxAmount,
          total: totals.total,
          amountDue: totals.total,
          depositRequired: totals.depositRequired,
          cancellationFee: totals.cancellationFee,
          updatedAt: new Date(),
        })
        .where(eq(laybys.id, laybyId));

      for (let i = 0; i < productData.length; i++) {
        const product = productData[i];
        const lineCalc = totals.lineItems[i];

        await db.insert(laybyItems).values({
          id: nanoid(),
          laybyId: layby.id,
          productId: product.id,
          quantity: product.quantity,
          price: product.price,
          discountId: product.discountId,
          discountPercentage: lineCalc.discountPercentage,
          discountAmount: lineCalc.discountAmount,
          lineTotal: lineCalc.lineTotal,
          stockReserved: false,
        });
      }
    } else {
      await db
        .update(laybys)
        .set({
          customerId: dto.customerId,
          laybyDate: dto.laybyDate,
          notes: dto.notes,
          updatedAt: new Date(),
        })
        .where(eq(laybys.id, laybyId));
    }

    return await this.getLaybyById(tenantId, laybyId);
  }

  // Get layby by ID
  async getLaybyById(tenantId: string, laybyId: string) {
    const db = getTenantDb(tenantId);

    const [layby] = await db
      .select()
      .from(laybys)
      .where(eq(laybys.id, laybyId))
      .limit(1);

    if (!layby) {
      throw new Error("Layby not found");
    }

    // Get items
    const items = await db
      .select({
        id: laybyItems.id,
        productId: laybyItems.productId,
        productName: products.name,
        productSku: products.sku,
        quantity: laybyItems.quantity,
        price: laybyItems.price,
        stockReserved: laybyItems.stockReserved,
        stockReservedAt: laybyItems.stockReservedAt,
        discountId: laybyItems.discountId,
        discountPercentage: laybyItems.discountPercentage,
        discountAmount: laybyItems.discountAmount,
        lineTotal: laybyItems.lineTotal,
      })
      .from(laybyItems)
      .leftJoin(products, eq(laybyItems.productId, products.id))
      .where(eq(laybyItems.laybyId, laybyId));

    // Get payments
    const laybyPayments = await db
      .select({
        id: payments.id,
        receiptNumber: payments.receiptNumber,
        amount: payments.amount,
        currencyId: payments.currencyId,
        currencyName: currencies.name,
        currencySymbol: currencies.symbol,
        paymentMethodId: payments.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        exchangeRate: payments.exchangeRate,
        amountInBaseCurrency: payments.amountInBaseCurrency,
        referenceNumber: payments.referenceNumber,
        paymentDate: payments.paymentDate,
        notes: payments.notes,
        createdBy: payments.createdBy,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(currencies, eq(payments.currencyId, currencies.id))
      .leftJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id))
      .where(eq(payments.laybyId, laybyId));

    return {
      ...layby,
      items,
      payments: laybyPayments,
    };
  }

  // Get all laybys
  async getAllLaybys(
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
      conditions.push(eq(laybys.branchId, filters.branchId));
    }

    if (filters.customerId) {
      conditions.push(eq(laybys.customerId, filters.customerId));
    }

    if (filters.status) {
      conditions.push(eq(laybys.status, filters.status as any));
    }

    if (filters.startDate) {
      conditions.push(gte(laybys.laybyDate, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(laybys.laybyDate, filters.endDate));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select({
        id: laybys.id,
        laybyNumber: laybys.laybyNumber,
        branchId: laybys.branchId,
        branchName: branches.name,
        customerId: laybys.customerId,
        customerName: customers.name,
        laybyDate: laybys.laybyDate,
        subtotal: laybys.subtotal,
        discountAmount: laybys.discountAmount,
        taxAmount: laybys.taxAmount,
        total: laybys.total,
        depositRequired: laybys.depositRequired,
        amountPaid: laybys.amountPaid,
        amountDue: laybys.amountDue,
        status: laybys.status,
        notes: laybys.notes,
        cancelledAt: laybys.cancelledAt,
        collectedAt: laybys.collectedAt,
        createdBy: laybys.createdBy,
        createdAt: laybys.createdAt,
      })
      .from(laybys)
      .leftJoin(branches, eq(laybys.branchId, branches.id))
      .leftJoin(customers, eq(laybys.customerId, customers.id))
      .where(where)
      .orderBy(sql`${laybys.laybyDate} DESC`);
  }

  // Get active laybys
  async getActiveLaybys(tenantId: string, branchId?: string) {
    const db = getTenantDb(tenantId);

    const conditions = [
      sql`${laybys.status} IN ('active', 'partially_paid', 'fully_paid')`,
    ];

    if (branchId) {
      conditions.push(eq(laybys.branchId, branchId));
    }

    return await db
      .select()
      .from(laybys)
      .where(and(...conditions))
      .orderBy(sql`${laybys.laybyDate} ASC`);
  }
}
