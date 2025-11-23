import { and, eq, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/tenant.db";
import { suppliers } from "../../db/schemas/tenant.schema";

export interface CreateSupplierDto {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  vatNumber?: string;
  tinNumber?: string;
  contactPerson?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  vatNumber?: string;
  tinNumber?: string;
  contactPerson?: string;
  isActive?: boolean;
}

export class SuppliersService {
  async getAllSuppliers(tenantId: string, search?: string) {
    const db = getTenantDb(tenantId);

    if (search) {
      return await db
        .select()
        .from(suppliers)
        .where(
          or(
            like(suppliers.name, `%${search}%`),
            like(suppliers.email, `%${search}%`),
            like(suppliers.phone, `%${search}%`),
          ),
        )
        .orderBy(suppliers.name);
    }

    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getSupplierById(tenantId: string, supplierId: string) {
    const db = getTenantDb(tenantId);
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }

  async createSupplier(tenantId: string, dto: CreateSupplierDto) {
    const db = getTenantDb(tenantId);

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        id: nanoid(),
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        vatNumber: dto.vatNumber,
        tinNumber: dto.tinNumber,
        contactPerson: dto.contactPerson,
      })
      .returning();

    return newSupplier;
  }

  async updateSupplier(
    tenantId: string,
    supplierId: string,
    dto: UpdateSupplierDto,
  ) {
    const db = getTenantDb(tenantId);

    const [existing] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    if (!existing) {
      throw new Error("Supplier not found");
    }

    const [updated] = await db
      .update(suppliers)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, supplierId))
      .returning();

    return updated;
  }

  async deleteSupplier(tenantId: string, supplierId: string) {
    const db = getTenantDb(tenantId);

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    await db.delete(suppliers).where(eq(suppliers.id, supplierId));

    return { success: true };
  }
}
