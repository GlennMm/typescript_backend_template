import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { currencies } from "../../db/schemas/tenant.schema";
import { getTenantDb } from "@/db/connection";

export interface CreateCurrencyDto {
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault?: boolean;
  detail?: string;
}

export interface UpdateCurrencyDto {
  name?: string;
  symbol?: string;
  exchangeRate?: number;
  isDefault?: boolean;
  detail?: string;
  isActive?: boolean;
}

export class CurrenciesService {
  async getAllCurrencies(tenantId: string) {
    const db = getTenantDb(tenantId);
    return await db.select().from(currencies).orderBy(currencies.name);
  }

  async getCurrencyById(tenantId: string, currencyId: string) {
    const db = getTenantDb(tenantId);
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);

    if (!currency) {
      throw new Error("Currency not found");
    }

    return currency;
  }

  async createCurrency(tenantId: string, dto: CreateCurrencyDto) {
    const db = getTenantDb(tenantId);

    // If setting as default, unset all other defaults first
    if (dto.isDefault) {
      await db
        .update(currencies)
        .set({ isDefault: false })
        .where(eq(currencies.isDefault, true));
    }

    const [newCurrency] = await db
      .insert(currencies)
      .values({
        id: nanoid(),
        name: dto.name,
        symbol: dto.symbol,
        exchangeRate: dto.exchangeRate,
        isDefault: dto.isDefault ?? false,
        detail: dto.detail,
      })
      .returning();

    return newCurrency;
  }

  async updateCurrency(
    tenantId: string,
    currencyId: string,
    dto: UpdateCurrencyDto,
  ) {
    const db = getTenantDb(tenantId);

    // Check if currency exists
    const [existing] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);

    if (!existing) {
      throw new Error("Currency not found");
    }

    // If setting as default, unset all other defaults first
    if (dto.isDefault && !existing.isDefault) {
      await db
        .update(currencies)
        .set({ isDefault: false })
        .where(eq(currencies.isDefault, true));
    }

    const [updated] = await db
      .update(currencies)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(currencies.id, currencyId))
      .returning();

    return updated;
  }

  async deleteCurrency(tenantId: string, currencyId: string) {
    const db = getTenantDb(tenantId);

    // Check if it's the default currency
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);

    if (!currency) {
      throw new Error("Currency not found");
    }

    if (currency.isDefault) {
      throw new Error(
        "Cannot delete the default currency. Please set another currency as default first.",
      );
    }

    await db.delete(currencies).where(eq(currencies.id, currencyId));

    return { success: true };
  }

  async setDefaultCurrency(tenantId: string, currencyId: string) {
    const db = getTenantDb(tenantId);

    // Check if currency exists
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);

    if (!currency) {
      throw new Error("Currency not found");
    }

    // Unset all other defaults
    await db
      .update(currencies)
      .set({ isDefault: false })
      .where(eq(currencies.isDefault, true));

    // Set this as default
    const [updated] = await db
      .update(currencies)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(currencies.id, currencyId))
      .returning();

    return updated;
  }
}
