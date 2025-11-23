import { and, eq, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import {
  branchInventory,
  branches,
  currencies,
  paymentMethods,
  productCostHistory,
  products,
  purchaseItems,
  purchasePayments,
  purchases,
  suppliers,
} from "../../db/schemas/tenant.schema";

interface CreatePurchaseDto {
  branchId: string;
  supplierId: string;
  purchaseDate?: Date;
  expectedDeliveryDate?: Date;
  invoiceNumber?: string;
  notes?: string;
  shippingCost?: number;
  taxApplied?: boolean;
  taxAmount?: number;
  items: {
    productId: string;
    quantity: number;
    totalAmount: number;
    notes?: string;
  }[];
}

interface UpdatePurchaseDto {
  supplierId?: string;
  purchaseDate?: Date;
  expectedDeliveryDate?: Date;
  invoiceNumber?: string;
  notes?: string;
  shippingCost?: number;
  taxApplied?: boolean;
  taxAmount?: number;
  items?: {
    productId: string;
    quantity: number;
    totalAmount: number;
    notes?: string;
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

interface ReceiveGoodsDto {
  items: {
    itemId: string;
    quantityReceived: number;
  }[];
  actualDeliveryDate?: Date;
}

export class PurchasesService {
  // Generate unique PO number
  private async generatePONumber(tenantId: string): Promise<string> {
    const db = getTenantDb(tenantId);
    const year = new Date().getFullYear();
    const prefix = `PO${year}`;

    // Get the count of purchases this year
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchases)
      .where(sql`${purchases.poNumber} LIKE ${prefix + "%"}`);

    const nextNumber = (count[0]?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, "0")}`;
  }

  // Create purchase (draft)
  async createPurchase(
    tenantId: string,
    dto: CreatePurchaseDto,
    createdBy: string,
  ) {
    const db = getTenantDb(tenantId);

    // Verify branch and supplier exist
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, dto.branchId))
      .limit(1);

    if (!branch) {
      throw new Error("Branch not found");
    }

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, dto.supplierId))
      .limit(1);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Calculate subtotal and validate items
    let subtotal = 0;
    const validatedItems = [];

    for (const item of dto.items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const newCostPrice = item.totalAmount / item.quantity;

      validatedItems.push({
        ...item,
        currentCostPrice: product.cost || 0,
        newCostPrice,
      });

      subtotal += item.totalAmount;
    }

    // Calculate total
    const shippingCost = dto.shippingCost || 0;
    const taxAmount = dto.taxApplied ? dto.taxAmount || 0 : 0;
    const total = subtotal + shippingCost + taxAmount;

    // Generate PO number
    const poNumber = await this.generatePONumber(tenantId);

    // Create purchase
    const [newPurchase] = await db
      .insert(purchases)
      .values({
        id: nanoid(),
        poNumber,
        branchId: dto.branchId,
        supplierId: dto.supplierId,
        purchaseDate: dto.purchaseDate || new Date(),
        expectedDeliveryDate: dto.expectedDeliveryDate,
        invoiceNumber: dto.invoiceNumber,
        notes: dto.notes,
        subtotal,
        shippingCost,
        taxApplied: dto.taxApplied || false,
        taxAmount,
        total,
        amountDue: total,
        createdBy,
        status: "draft",
      })
      .returning();

    // Create purchase items
    const items = validatedItems.map((item) => ({
      id: nanoid(),
      purchaseId: newPurchase.id,
      productId: item.productId,
      quantity: item.quantity,
      currentCostPrice: item.currentCostPrice,
      totalAmount: item.totalAmount,
      newCostPrice: item.newCostPrice,
      notes: item.notes,
    }));

    await db.insert(purchaseItems).values(items);

    return newPurchase;
  }

  // Get purchase by ID with details
  async getPurchaseById(tenantId: string, purchaseId: string) {
    const db = getTenantDb(tenantId);

    const [purchase] = await db
      .select({
        id: purchases.id,
        poNumber: purchases.poNumber,
        branchId: purchases.branchId,
        branchName: branches.name,
        supplierId: purchases.supplierId,
        supplierName: suppliers.name,
        purchaseDate: purchases.purchaseDate,
        expectedDeliveryDate: purchases.expectedDeliveryDate,
        actualDeliveryDate: purchases.actualDeliveryDate,
        invoiceNumber: purchases.invoiceNumber,
        notes: purchases.notes,
        subtotal: purchases.subtotal,
        shippingCost: purchases.shippingCost,
        taxApplied: purchases.taxApplied,
        taxAmount: purchases.taxAmount,
        total: purchases.total,
        amountPaid: purchases.amountPaid,
        amountDue: purchases.amountDue,
        status: purchases.status,
        createdBy: purchases.createdBy,
        createdAt: purchases.createdAt,
        updatedAt: purchases.updatedAt,
      })
      .from(purchases)
      .innerJoin(branches, eq(purchases.branchId, branches.id))
      .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    // Get items
    const items = await db
      .select({
        id: purchaseItems.id,
        productId: purchaseItems.productId,
        productName: products.name,
        productSku: products.sku,
        quantity: purchaseItems.quantity,
        quantityReceived: purchaseItems.quantityReceived,
        currentCostPrice: purchaseItems.currentCostPrice,
        totalAmount: purchaseItems.totalAmount,
        newCostPrice: purchaseItems.newCostPrice,
        notes: purchaseItems.notes,
      })
      .from(purchaseItems)
      .innerJoin(products, eq(purchaseItems.productId, products.id))
      .where(eq(purchaseItems.purchaseId, purchaseId));

    // Get payments
    const payments = await db
      .select({
        id: purchasePayments.id,
        amount: purchasePayments.amount,
        currencyId: purchasePayments.currencyId,
        currencyName: currencies.name,
        currencySymbol: currencies.symbol,
        paymentMethodId: purchasePayments.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        exchangeRate: purchasePayments.exchangeRate,
        amountInBaseCurrency: purchasePayments.amountInBaseCurrency,
        referenceNumber: purchasePayments.referenceNumber,
        paymentDate: purchasePayments.paymentDate,
        notes: purchasePayments.notes,
        createdBy: purchasePayments.createdBy,
        createdAt: purchasePayments.createdAt,
      })
      .from(purchasePayments)
      .innerJoin(currencies, eq(purchasePayments.currencyId, currencies.id))
      .innerJoin(
        paymentMethods,
        eq(purchasePayments.paymentMethodId, paymentMethods.id),
      )
      .where(eq(purchasePayments.purchaseId, purchaseId));

    return {
      ...purchase,
      items,
      payments,
    };
  }

  // Get all purchases with filters
  async getAllPurchases(
    tenantId: string,
    filters?: {
      branchId?: string;
      supplierId?: string;
      status?: string;
    },
  ) {
    const db = getTenantDb(tenantId);

    let query = db
      .select({
        id: purchases.id,
        poNumber: purchases.poNumber,
        branchId: purchases.branchId,
        branchName: branches.name,
        supplierId: purchases.supplierId,
        supplierName: suppliers.name,
        purchaseDate: purchases.purchaseDate,
        expectedDeliveryDate: purchases.expectedDeliveryDate,
        total: purchases.total,
        amountPaid: purchases.amountPaid,
        amountDue: purchases.amountDue,
        status: purchases.status,
        createdAt: purchases.createdAt,
      })
      .from(purchases)
      .innerJoin(branches, eq(purchases.branchId, branches.id))
      .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .$dynamic();

    if (filters?.branchId) {
      query = query.where(eq(purchases.branchId, filters.branchId));
    }

    if (filters?.supplierId) {
      query = query.where(eq(purchases.supplierId, filters.supplierId));
    }

    if (filters?.status) {
      query = query.where(eq(purchases.status, filters.status as any));
    }

    return await query.orderBy(sql`${purchases.createdAt} DESC`);
  }

  // Update purchase (only in draft)
  async updatePurchase(
    tenantId: string,
    purchaseId: string,
    dto: UpdatePurchaseDto,
  ) {
    const db = getTenantDb(tenantId);

    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status !== "draft") {
      throw new Error("Can only update purchases in draft status");
    }

    // If items are being updated, recalculate totals
    let subtotal = purchase.subtotal;

    if (dto.items) {
      // Delete existing items
      await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));

      // Add new items
      subtotal = 0;
      const validatedItems = [];

      for (const item of dto.items) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const newCostPrice = item.totalAmount / item.quantity;

        validatedItems.push({
          id: nanoid(),
          purchaseId,
          productId: item.productId,
          quantity: item.quantity,
          currentCostPrice: product.cost || 0,
          totalAmount: item.totalAmount,
          newCostPrice,
          notes: item.notes,
        });

        subtotal += item.totalAmount;
      }

      await db.insert(purchaseItems).values(validatedItems);
    }

    // Recalculate total
    const shippingCost = dto.shippingCost ?? purchase.shippingCost;
    const taxAmount = dto.taxApplied ?? purchase.taxApplied ? dto.taxAmount ?? purchase.taxAmount : 0;
    const total = subtotal + shippingCost + taxAmount;

    const [updated] = await db
      .update(purchases)
      .set({
        supplierId: dto.supplierId ?? purchase.supplierId,
        purchaseDate: dto.purchaseDate ?? purchase.purchaseDate,
        expectedDeliveryDate: dto.expectedDeliveryDate ?? purchase.expectedDeliveryDate,
        invoiceNumber: dto.invoiceNumber ?? purchase.invoiceNumber,
        notes: dto.notes ?? purchase.notes,
        subtotal,
        shippingCost,
        taxApplied: dto.taxApplied ?? purchase.taxApplied,
        taxAmount,
        total,
        amountDue: total - purchase.amountPaid,
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, purchaseId))
      .returning();

    return updated;
  }

  // Submit purchase (draft → submitted)
  async submitPurchase(tenantId: string, purchaseId: string) {
    const db = getTenantDb(tenantId);

    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status !== "draft") {
      throw new Error("Can only submit purchases in draft status");
    }

    const [updated] = await db
      .update(purchases)
      .set({
        status: "submitted",
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, purchaseId))
      .returning();

    return updated;
  }

  // Add payment
  async addPayment(
    tenantId: string,
    purchaseId: string,
    dto: AddPaymentDto,
    createdBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status === "draft") {
      throw new Error("Cannot add payment to draft purchase. Submit it first.");
    }

    if (purchase.amountDue <= 0) {
      throw new Error("Purchase is already fully paid");
    }

    // Get currency exchange rate
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, dto.currencyId))
      .limit(1);

    if (!currency) {
      throw new Error("Currency not found");
    }

    // Verify payment method exists
    const [method] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, dto.paymentMethodId))
      .limit(1);

    if (!method) {
      throw new Error("Payment method not found");
    }

    // Calculate amount in base currency
    const amountInBaseCurrency = dto.amount * currency.exchangeRate;

    if (amountInBaseCurrency > purchase.amountDue) {
      throw new Error("Payment amount exceeds amount due");
    }

    // Create payment
    const [payment] = await db
      .insert(purchasePayments)
      .values({
        id: nanoid(),
        purchaseId,
        amount: dto.amount,
        currencyId: dto.currencyId,
        paymentMethodId: dto.paymentMethodId,
        exchangeRate: currency.exchangeRate,
        amountInBaseCurrency,
        referenceNumber: dto.referenceNumber,
        paymentDate: dto.paymentDate || new Date(),
        notes: dto.notes,
        createdBy,
      })
      .returning();

    // Update purchase amounts and status
    const newAmountPaid = purchase.amountPaid + amountInBaseCurrency;
    const newAmountDue = purchase.total - newAmountPaid;
    const newStatus =
      newAmountDue <= 0.01 ? "fully_paid" : "partially_paid"; // Allow small rounding diff

    await db
      .update(purchases)
      .set({
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, purchaseId));

    return payment;
  }

  // Delete payment (only if goods not received)
  async deletePayment(tenantId: string, paymentId: string) {
    const db = getTenantDb(tenantId);

    const [payment] = await db
      .select()
      .from(purchasePayments)
      .where(eq(purchasePayments.id, paymentId))
      .limit(1);

    if (!payment) {
      throw new Error("Payment not found");
    }

    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, payment.purchaseId))
      .limit(1);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status === "received") {
      throw new Error("Cannot delete payment - goods already received");
    }

    // Delete payment
    await db.delete(purchasePayments).where(eq(purchasePayments.id, paymentId));

    // Update purchase amounts and status
    const newAmountPaid = purchase.amountPaid - payment.amountInBaseCurrency;
    const newAmountDue = purchase.total - newAmountPaid;
    const newStatus =
      newAmountPaid <= 0
        ? "submitted"
        : newAmountDue > 0.01
          ? "partially_paid"
          : "fully_paid";

    await db
      .update(purchases)
      .set({
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, purchase.id));
  }

  // Receive goods (partial or full)
  async receiveGoods(
    tenantId: string,
    purchaseId: string,
    dto: ReceiveGoodsDto,
    receivedBy: string,
  ) {
    const db = getTenantDb(tenantId);

    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status === "draft") {
      throw new Error("Cannot receive goods for draft purchase");
    }

    // Update received quantities
    for (const item of dto.items) {
      const [purchaseItem] = await db
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.id, item.itemId))
        .limit(1);

      if (!purchaseItem) {
        throw new Error(`Purchase item not found: ${item.itemId}`);
      }

      const newQuantityReceived =
        purchaseItem.quantityReceived + item.quantityReceived;

      if (newQuantityReceived > purchaseItem.quantity) {
        throw new Error(
          `Cannot receive more than ordered quantity for item ${item.itemId}`,
        );
      }

      // Update quantity received
      await db
        .update(purchaseItems)
        .set({
          quantityReceived: newQuantityReceived,
          updatedAt: new Date(),
        })
        .where(eq(purchaseItems.id, item.itemId));

      // Add to inventory
      if (item.quantityReceived > 0) {
        const [existingInventory] = await db
          .select()
          .from(branchInventory)
          .where(
            and(
              eq(branchInventory.branchId, purchase.branchId),
              eq(branchInventory.productId, purchaseItem.productId),
            ),
          )
          .limit(1);

        if (existingInventory) {
          await db
            .update(branchInventory)
            .set({
              quantity: existingInventory.quantity + item.quantityReceived,
              lastRestocked: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(branchInventory.id, existingInventory.id));
        } else {
          await db.insert(branchInventory).values({
            id: nanoid(),
            branchId: purchase.branchId,
            productId: purchaseItem.productId,
            quantity: item.quantityReceived,
            minimumStock: 0,
            lastRestocked: new Date(),
          });
        }

        // Update product cost price if fully received and price changed
        if (newQuantityReceived === purchaseItem.quantity) {
          if (purchaseItem.newCostPrice !== purchaseItem.currentCostPrice) {
            const [product] = await db
              .select()
              .from(products)
              .where(eq(products.id, purchaseItem.productId))
              .limit(1);

            if (product) {
              // Create cost history record
              await db.insert(productCostHistory).values({
                id: nanoid(),
                productId: purchaseItem.productId,
                purchaseId,
                oldCostPrice: product.cost || 0,
                newCostPrice: purchaseItem.newCostPrice,
                changedBy: receivedBy,
              });

              // Update product cost
              await db
                .update(products)
                .set({
                  cost: purchaseItem.newCostPrice,
                  updatedAt: new Date(),
                })
                .where(eq(products.id, purchaseItem.productId));
            }
          }
        }
      }
    }

    // Check if all items fully received
    const allItems = await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, purchaseId));

    const allReceived = allItems.every(
      (item) => item.quantityReceived === item.quantity,
    );

    if (allReceived) {
      // Mark purchase as received
      await db
        .update(purchases)
        .set({
          status: "received",
          actualDeliveryDate: dto.actualDeliveryDate || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(purchases.id, purchaseId));
    }
  }

  // Cancel purchase (only draft with no payments)
  async cancelPurchase(tenantId: string, purchaseId: string) {
    const db = getTenantDb(tenantId);

    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status !== "draft") {
      throw new Error("Can only cancel purchases in draft status");
    }

    if (purchase.amountPaid > 0) {
      throw new Error("Cannot cancel purchase with payments");
    }

    // Delete purchase (cascade will delete items)
    await db.delete(purchases).where(eq(purchases.id, purchaseId));
  }

  // Get purchase history for product
  async getProductPurchaseHistory(tenantId: string, productId: string) {
    const db = getTenantDb(tenantId);

    const history = await db
      .select({
        purchaseId: purchases.id,
        poNumber: purchases.poNumber,
        purchaseDate: purchases.purchaseDate,
        supplierName: suppliers.name,
        quantity: purchaseItems.quantity,
        quantityReceived: purchaseItems.quantityReceived,
        newCostPrice: purchaseItems.newCostPrice,
        totalAmount: purchaseItems.totalAmount,
        status: purchases.status,
      })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(eq(purchaseItems.productId, productId))
      .orderBy(sql`${purchases.purchaseDate} DESC`);

    return history;
  }

  // Get unpaid purchases
  async getUnpaidPurchases(tenantId: string) {
    const db = getTenantDb(tenantId);

    return await db
      .select({
        id: purchases.id,
        poNumber: purchases.poNumber,
        branchName: branches.name,
        supplierName: suppliers.name,
        purchaseDate: purchases.purchaseDate,
        total: purchases.total,
        amountPaid: purchases.amountPaid,
        amountDue: purchases.amountDue,
        status: purchases.status,
      })
      .from(purchases)
      .innerJoin(branches, eq(purchases.branchId, branches.id))
      .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(
        or(
          eq(purchases.status, "submitted"),
          eq(purchases.status, "partially_paid"),
        ),
      )
      .orderBy(sql`${purchases.purchaseDate} DESC`);
  }
}
