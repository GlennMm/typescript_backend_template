import { eq, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import { customers } from "../../db/schemas/tenant.schema";
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
} from "./customers.validation";

export class CustomersService {
  async getAllCustomers(tenantId: string, search?: string) {
    const db = getTenantDb(tenantId);

    let query = db.select().from(customers);

    if (search) {
      query = query.where(
        or(
          like(customers.firstName, `%${search}%`),
          like(customers.lastName, `%${search}%`),
          like(customers.email, `%${search}%`),
          like(customers.phone, `%${search}%`),
        ),
      );
    }

    const allCustomers = await query.orderBy(customers.firstName);

    return allCustomers;
  }

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

  async createCustomer(tenantId: string, dto: CreateCustomerDto) {
    const db = getTenantDb(tenantId);

    // Check if email already exists (if provided)
    if (dto.email) {
      const [existingCustomer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, dto.email))
        .limit(1);

      if (existingCustomer) {
        throw new Error("Customer with this email already exists");
      }
    }

    const [newCustomer] = await db
      .insert(customers)
      .values({
        id: nanoid(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email || null,
        phone: dto.phone || null,
        address: dto.address || null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        loyaltyPoints: dto.loyaltyPoints,
      })
      .returning();

    return newCustomer;
  }

  async updateCustomer(
    tenantId: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ) {
    const db = getTenantDb(tenantId);

    // Check if customer exists
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    // If email is being updated, check if it's already taken
    if (dto.email && dto.email !== existingCustomer.email) {
      const [emailTaken] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, dto.email))
        .limit(1);

      if (emailTaken) {
        throw new Error("Email already in use");
      }
    }

    const updateData: any = { ...dto, updatedAt: new Date() };
    if (dto.dateOfBirth) {
      updateData.dateOfBirth = new Date(dto.dateOfBirth);
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, customerId))
      .returning();

    return updatedCustomer;
  }

  async deleteCustomer(tenantId: string, customerId: string) {
    const db = getTenantDb(tenantId);

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      throw new Error("Customer not found");
    }

    await db.delete(customers).where(eq(customers.id, customerId));

    return { message: "Customer deleted successfully" };
  }
}
