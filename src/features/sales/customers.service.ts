import { and, eq, like, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import { customers, branches } from "../../db/schemas/tenant.schema";

interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  customerType?: "individual" | "business";
  vatNumber?: string;
  tinNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
}

interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  customerType?: "individual" | "business";
  vatNumber?: string;
  tinNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  isActive?: boolean;
}

export class CustomersService {
  // Create customer
  async createCustomer(tenantId: string, dto: CreateCustomerDto) {
    const db = getTenantDb(tenantId);

    const fullName = `${dto.firstName} ${dto.lastName}`.trim();

    const [customer] = await db
      .insert(customers)
      .values({
        id: nanoid(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        name: fullName,
        customerType: dto.customerType || "individual",
        vatNumber: dto.vatNumber,
        tinNumber: dto.tinNumber,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        dateOfBirth: dto.dateOfBirth,
        isWalkIn: false,
        isActive: true,
      })
      .returning();

    return customer;
  }

  // Get or create walk-in customer for branch
  async getWalkInCustomer(tenantId: string, branchId: string) {
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

    // Try to find existing walk-in customer
    let [walkIn] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.branchId, branchId),
          eq(customers.isWalkIn, true),
        ),
      )
      .limit(1);

    // Create if doesn't exist
    if (!walkIn) {
      [walkIn] = await db
        .insert(customers)
        .values({
          id: nanoid(),
          firstName: "Walk-In",
          lastName: `Customer (${branch.name})`,
          name: `Walk-In Customer (${branch.name})`,
          customerType: "individual",
          branchId,
          isWalkIn: true,
          isActive: true,
        })
        .returning();
    }

    return walkIn;
  }

  // Get customer by ID
  async getCustomerById(tenantId: string, customerId: string) {
    const db = getTenantDb(tenantId);

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  }

  // Get all customers
  async getAllCustomers(
    tenantId: string,
    filters: {
      search?: string;
      customerType?: "individual" | "business";
      isActive?: boolean;
      excludeWalkIn?: boolean;
    } = {},
  ) {
    const db = getTenantDb(tenantId);

    const conditions = [];

    if (filters.search) {
      conditions.push(
        or(
          like(customers.name, `%${filters.search}%`),
          like(customers.email, `%${filters.search}%`),
          like(customers.phone, `%${filters.search}%`),
        ),
      );
    }

    if (filters.customerType) {
      conditions.push(eq(customers.customerType, filters.customerType));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(customers.isActive, filters.isActive));
    }

    if (filters.excludeWalkIn) {
      conditions.push(eq(customers.isWalkIn, false));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(customers)
      .where(where)
      .orderBy(sql`${customers.name} ASC`);
  }

  // Update customer
  async updateCustomer(
    tenantId: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ) {
    const db = getTenantDb(tenantId);

    // Check if customer exists
    const existing = await this.getCustomerById(tenantId, customerId);

    // Cannot update walk-in customers
    if (existing.isWalkIn) {
      throw new Error("Cannot update walk-in customer");
    }

    // Calculate new full name if firstName or lastName changed
    let fullName = existing.name;
    if (dto.firstName || dto.lastName) {
      const firstName = dto.firstName || existing.firstName;
      const lastName = dto.lastName || existing.lastName;
      fullName = `${firstName} ${lastName}`.trim();
    }

    const [updated] = await db
      .update(customers)
      .set({
        ...dto,
        name: fullName,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    return updated;
  }

  // Delete customer (soft delete)
  async deleteCustomer(tenantId: string, customerId: string) {
    const db = getTenantDb(tenantId);

    const existing = await this.getCustomerById(tenantId, customerId);

    // Cannot delete walk-in customers
    if (existing.isWalkIn) {
      throw new Error("Cannot delete walk-in customer");
    }

    const [deleted] = await db
      .update(customers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    return deleted;
  }

  // Update loyalty points
  async updateLoyaltyPoints(
    tenantId: string,
    customerId: string,
    points: number,
  ) {
    const db = getTenantDb(tenantId);

    const [updated] = await db
      .update(customers)
      .set({
        loyaltyPoints: points,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    if (!updated) {
      throw new Error("Customer not found");
    }

    return updated;
  }

  // Update last purchase date
  async updateLastPurchase(tenantId: string, customerId: string) {
    const db = getTenantDb(tenantId);

    const [updated] = await db
      .update(customers)
      .set({
        lastPurchaseAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    if (!updated) {
      throw new Error("Customer not found");
    }

    return updated;
  }
}
