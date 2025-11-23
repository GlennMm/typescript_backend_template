import { and, eq, sql, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import {
  sales,
  saleItems,
  payments,
  products,
  customers,
  branches,
  branchInventory,
  branchDiscounts,
  currencies,
  paymentMethods,
} from "../../db/schemas/tenant.schema";
import { SettingsService } from "./settings.service";
import { CustomersService } from "./customers.service";

interface CreateCreditSaleDto {
  branchId: string;
  customerId: string;
  saleDate?: Date;
  notes?: string;
  saleDiscountId?: string;
  items: {
    productId: string;
    quantity: number;
    discountId?: string;
  }[];
}

interface CreateTillSaleDto {
  branchId: string;
  customerId?: string; // Optional, will use walk-in if not provided
  saleDate?: Date;
  notes?: string;
  saleDiscountId?: string;
  items: {
    productId: string;
    quantity: number;
    discountId?: string;
  }[];
  payment: {
    amount: number;
    currencyId: string;
    paymentMethodId: string;
    referenceNumber?: string;
    notes?: string;
  };
}

interface UpdateSaleDto {
  customerId?: string;
  saleDate?: Date;
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

export class SalesService {
  private settingsService: SettingsService;
  private customersService: CustomersService;

  constructor() {
    this.settingsService = new SettingsService();
    this.customersService = new CustomersService();
  }

  // Generate unique invoice number
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const db = getTenantDb(tenantId);
    const year = new Date().getFullYear();
    const prefix = `INV${year}`;

    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(sales)
      .where(sql`${sales.invoiceNumber} LIKE ${prefix + "%"}`);

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

  // Calculate totals with discounts and tax
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
    // Get tax settings
    const settings = await this.settingsService.getBranchSettings(
      tenantId,
      branchId,
    );

    // Calculate line totals with line discounts
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

    // Sum all line totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

    // Apply sale-level discount
    const saleDiscountPercentage = saleDiscount?.percentage || 0;
    const saleDiscountAmount = (subtotal * saleDiscountPercentage) / 100;
    const discountedSubtotal = subtotal - saleDiscountAmount;

    // Calculate tax
    let taxAmount = 0;
    let finalTotal = discountedSubtotal;

    if (settings.taxMode === "inclusive") {
      // Tax included in price: extract tax
      taxAmount =
        discountedSubtotal - discountedSubtotal / (1 + settings.taxRate / 100);
    } else {
      // Tax exclusive: add tax
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

  // Deduct stock from inventory
  private async deductStock(
    tenantId: string,
    branchId: string,
    items: { productId: string; quantity: number }[],
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

      // Deduct stock
      await db
        .update(branchInventory)
        .set({
          quantity: inventory.quantity - item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(branchInventory.id, inventory.id));
    }
  }

  // Create credit sale (draft)
  async createCreditSale(
    tenantId: string,
    dto: CreateCreditSaleDto,
    createdBy: string,
  ) {
    const db = getTenantDb(tenantId);

    // Verify branch, customer exist
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, dto.branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    const customer = await this.customersService.getCustomerById(
      tenantId,
      dto.customerId,
    );

    // Verify all products exist and get prices
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

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (!product.isActive) {
        throw new Error(`Product is inactive: ${product.name}`);
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

    // Get sale discount
    let saleDiscount = null;
    if (dto.saleDiscountId) {
      saleDiscount = discountMap.get(dto.saleDiscountId);
      if (!saleDiscount) {
        throw new Error("Sale discount not found or inactive");
      }
    }

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

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Create sale
    const [sale] = await db
      .insert(sales)
      .values({
        id: nanoid(),
        invoiceNumber,
        branchId: dto.branchId,
        customerId: dto.customerId,
        saleType: "credit",
        saleDate: dto.saleDate || new Date(),
        subtotal: totals.subtotal,
        saleDiscountId: dto.saleDiscountId,
        saleDiscountPercentage: totals.saleDiscountPercentage,
        discountAmount: totals.saleDiscountAmount,
        taxMode: totals.taxMode,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        amountPaid: 0,
        amountDue: totals.total,
        status: "draft",
        notes: dto.notes,
        createdBy,
      })
      .returning();

    // Create sale items
    for (let i = 0; i < productData.length; i++) {
      const product = productData[i];
      const lineCalc = totals.lineItems[i];

      await db.insert(saleItems).values({
        id: nanoid(),
        saleId: sale.id,
        productId: product.id,
        quantity: product.quantity,
        price: product.price,
        discountId: product.discountId,
        discountPercentage: lineCalc.discountPercentage,
        discountAmount: lineCalc.discountAmount,
        lineTotal: lineCalc.lineTotal,
      });
    }

    return await this.getSaleById(tenantId, sale.id);
  }

  // Create till sale (immediate, auto-confirmed)
  async createTillSale(
    tenantId: string,
    dto: CreateTillSaleDto,
    createdBy: string,
  ) {
    const db = getTenantDb(tenantId);

    // Get or create walk-in customer if not provided
    let customerId = dto.customerId;
    if (!customerId) {
      const walkInCustomer = await this.customersService.getWalkInCustomer(
        tenantId,
        dto.branchId,
      );
      customerId = walkInCustomer.id;
    }

    // Create as credit sale first (draft)
    const draftSale = await this.createCreditSale(
      tenantId,
      {
        ...dto,
        customerId,
      },
      createdBy,
    );

    // Confirm the sale (deduct stock, change status to confirmed)
    const confirmedSale = await this.confirmSale(
      tenantId,
      draftSale.id,
      createdBy,
    );

    // Add payment (full payment required for till sales)
    const paymentAdded = await this.addPayment(
      tenantId,
      draftSale.id,
      dto.payment,
      createdBy,
    );

    // Mark as completed
    const [completedSale] = await db
      .update(sales)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(sales.id, draftSale.id))
      .returning();

    return await this.getSaleById(tenantId, completedSale.id);
  }

  // Confirm sale (deduct stock, transition draft → confirmed)
  async confirmSale(tenantId: string, saleId: string, confirmedBy: string) {
    const db = getTenantDb(tenantId);

    // Get sale
    const sale = await this.getSaleById(tenantId, saleId);

    if (sale.status !== "draft") {
      throw new Error("Only draft sales can be confirmed");
    }

    // Deduct stock
    await this.deductStock(
      tenantId,
      sale.branchId,
      sale.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );

    // Update status
    const [updated] = await db
      .update(sales)
      .set({
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(sales.id, saleId))
      .returning();

    // Update customer last purchase
    await this.customersService.updateLastPurchase(tenantId, sale.customerId);

    return await this.getSaleById(tenantId, updated.id);
  }

  // Add payment to sale
  async addPayment(
    tenantId: string,
    saleId: string,
    dto: AddPaymentDto,
    createdBy: string,
  ) {
    const db = getTenantDb(tenantId);

    // Get sale
    const sale = await this.getSaleById(tenantId, saleId);

    if (
      !["confirmed", "partially_paid", "fully_paid"].includes(sale.status)
    ) {
      throw new Error(
        "Can only add payments to confirmed or partially paid sales",
      );
    }

    // Verify currency and payment method exist
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
    if (amountInBaseCurrency > sale.amountDue + 0.01) {
      // Allow small rounding
      throw new Error(
        `Payment amount (${amountInBaseCurrency.toFixed(2)}) exceeds amount due (${sale.amountDue.toFixed(2)})`,
      );
    }

    // Generate receipt number
    const receiptNumber = await this.generateReceiptNumber(tenantId);

    // Create payment
    await db.insert(payments).values({
      id: nanoid(),
      receiptNumber,
      saleId: sale.id,
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

    // Update sale amounts
    const newAmountPaid = sale.amountPaid + amountInBaseCurrency;
    const newAmountDue = sale.total - newAmountPaid;

    // Determine new status
    let newStatus: "confirmed" | "partially_paid" | "fully_paid" = sale.status as any;
    if (newAmountDue <= 0.01) {
      // Fully paid (allow small rounding)
      newStatus = "fully_paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partially_paid";
    }

    await db
      .update(sales)
      .set({
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(sales.id, saleId));

    return await this.getSaleById(tenantId, saleId);
  }

  // Update sale (only draft)
  async updateSale(tenantId: string, saleId: string, dto: UpdateSaleDto) {
    const db = getTenantDb(tenantId);

    const sale = await this.getSaleById(tenantId, saleId);

    if (sale.status !== "draft") {
      throw new Error("Only draft sales can be updated");
    }

    // If items are being updated, recalculate everything
    if (dto.items) {
      // Delete existing items
      await db.delete(saleItems).where(eq(saleItems.saleId, saleId));

      // Similar logic to create - verify products, get prices, calculate totals
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
        dto.saleDiscountId || sale.saleDiscountId,
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

      const saleDiscountId = dto.saleDiscountId || sale.saleDiscountId;
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
        sale.branchId,
        itemsForCalc,
        saleDiscount,
      );

      // Update sale
      await db
        .update(sales)
        .set({
          customerId: dto.customerId,
          saleDate: dto.saleDate,
          notes: dto.notes,
          saleDiscountId,
          subtotal: totals.subtotal,
          saleDiscountPercentage: totals.saleDiscountPercentage,
          discountAmount: totals.saleDiscountAmount,
          taxAmount: totals.taxAmount,
          total: totals.total,
          amountDue: totals.total,
          updatedAt: new Date(),
        })
        .where(eq(sales.id, saleId));

      // Create new items
      for (let i = 0; i < productData.length; i++) {
        const product = productData[i];
        const lineCalc = totals.lineItems[i];

        await db.insert(saleItems).values({
          id: nanoid(),
          saleId: sale.id,
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
      // Just update basic fields
      await db
        .update(sales)
        .set({
          customerId: dto.customerId,
          saleDate: dto.saleDate,
          notes: dto.notes,
          updatedAt: new Date(),
        })
        .where(eq(sales.id, saleId));
    }

    return await this.getSaleById(tenantId, saleId);
  }

  // Get sale by ID with items and payments
  async getSaleById(tenantId: string, saleId: string) {
    const db = getTenantDb(tenantId);

    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, saleId))
      .limit(1);

    if (!sale) {
      throw new Error("Sale not found");
    }

    // Get items
    const items = await db
      .select({
        id: saleItems.id,
        productId: saleItems.productId,
        productName: products.name,
        productSku: products.sku,
        quantity: saleItems.quantity,
        price: saleItems.price,
        discountId: saleItems.discountId,
        discountPercentage: saleItems.discountPercentage,
        discountAmount: saleItems.discountAmount,
        lineTotal: saleItems.lineTotal,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, saleId));

    // Get payments
    const salePayments = await db
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
      .where(eq(payments.saleId, saleId));

    return {
      ...sale,
      items,
      payments: salePayments,
    };
  }

  // Get all sales with filters
  async getAllSales(
    tenantId: string,
    filters: {
      branchId?: string;
      customerId?: string;
      status?: string;
      saleType?: "credit" | "till";
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const db = getTenantDb(tenantId);

    const conditions = [];

    if (filters.branchId) {
      conditions.push(eq(sales.branchId, filters.branchId));
    }

    if (filters.customerId) {
      conditions.push(eq(sales.customerId, filters.customerId));
    }

    if (filters.status) {
      conditions.push(eq(sales.status, filters.status as any));
    }

    if (filters.saleType) {
      conditions.push(eq(sales.saleType, filters.saleType));
    }

    if (filters.startDate) {
      conditions.push(gte(sales.saleDate, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(sales.saleDate, filters.endDate));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        branchId: sales.branchId,
        branchName: branches.name,
        customerId: sales.customerId,
        customerName: customers.name,
        saleType: sales.saleType,
        saleDate: sales.saleDate,
        subtotal: sales.subtotal,
        discountAmount: sales.discountAmount,
        taxAmount: sales.taxAmount,
        total: sales.total,
        amountPaid: sales.amountPaid,
        amountDue: sales.amountDue,
        status: sales.status,
        notes: sales.notes,
        createdBy: sales.createdBy,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .leftJoin(branches, eq(sales.branchId, branches.id))
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(where)
      .orderBy(sql`${sales.saleDate} DESC`);
  }

  // Get unpaid sales
  async getUnpaidSales(tenantId: string, branchId?: string) {
    const db = getTenantDb(tenantId);

    const conditions = [
      sql`${sales.status} IN ('confirmed', 'partially_paid')`,
      sql`${sales.amountDue} > 0`,
    ];

    if (branchId) {
      conditions.push(eq(sales.branchId, branchId));
    }

    return await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(sql`${sales.saleDate} ASC`);
  }

  // Cancel sale (only draft)
  async cancelSale(tenantId: string, saleId: string) {
    const db = getTenantDb(tenantId);

    const sale = await this.getSaleById(tenantId, saleId);

    if (sale.status !== "draft") {
      throw new Error("Only draft sales can be cancelled");
    }

    // Delete sale items
    await db.delete(saleItems).where(eq(saleItems.saleId, saleId));

    // Delete sale
    await db.delete(sales).where(eq(sales.id, saleId));

    return { success: true, message: "Sale cancelled successfully" };
  }
}
