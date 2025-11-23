import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import { shopSettings } from "../../db/schemas/tenant.schema";
import type {
  CreateShopSettingsDto,
  UpdateShopSettingsDto,
} from "./shop-settings.validation";

export class ShopSettingsService {
  async getShopSettings(tenantId: string) {
    const db = getTenantDb(tenantId);

    const [settings] = await db.select().from(shopSettings).limit(1);

    if (!settings) {
      throw new Error("Shop settings not found. Please initialize settings first.");
    }

    return settings;
  }

  async createShopSettings(tenantId: string, dto: CreateShopSettingsDto) {
    const db = getTenantDb(tenantId);

    // Check if settings already exist (should only have one record)
    const [existingSettings] = await db.select().from(shopSettings).limit(1);

    if (existingSettings) {
      throw new Error("Shop settings already exist. Use update instead.");
    }

    const [newSettings] = await db
      .insert(shopSettings)
      .values({
        id: nanoid(),
        companyName: dto.companyName,
        tradingName: dto.tradingName || null,
        vatNumber: dto.vatNumber || null,
        tinNumber: dto.tinNumber || null,
        businessRegistrationNumber: dto.businessRegistrationNumber || null,
        defaultTaxRate: dto.defaultTaxRate,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2 || null,
        city: dto.city,
        stateProvince: dto.stateProvince || null,
        postalCode: dto.postalCode,
        country: dto.country,
        phoneNumber: dto.phoneNumber,
        alternativePhone: dto.alternativePhone || null,
        email: dto.email,
        faxNumber: dto.faxNumber || null,
        website: dto.website || null,
        defaultCurrency: dto.defaultCurrency,
        defaultTimezone: dto.defaultTimezone || null,
        logoUrl: dto.logoUrl || null,
        defaultReceiptHeader: dto.defaultReceiptHeader || null,
        defaultReceiptFooter: dto.defaultReceiptFooter || null,
      })
      .returning();

    return newSettings;
  }

  async updateShopSettings(tenantId: string, dto: UpdateShopSettingsDto) {
    const db = getTenantDb(tenantId);

    // Get existing settings
    const [existingSettings] = await db.select().from(shopSettings).limit(1);

    if (!existingSettings) {
      throw new Error("Shop settings not found. Please initialize settings first.");
    }

    const [updatedSettings] = await db
      .update(shopSettings)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.id, existingSettings.id))
      .returning();

    return updatedSettings;
  }

  async hasShopSettings(tenantId: string): Promise<boolean> {
    const db = getTenantDb(tenantId);

    const [settings] = await db
      .select({ id: shopSettings.id })
      .from(shopSettings)
      .limit(1);

    return !!settings;
  }
}
