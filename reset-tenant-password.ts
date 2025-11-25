import { eq } from "drizzle-orm";
import { getTenantDb, getMainDb } from "./src/db/connection";
import { tenants } from "./src/db/schemas/main.schema";
import { users } from "./src/db/schemas/tenant.schema";
import { hashPassword } from "./src/utils/password";

const tenantSlug = "nirgens-software-solutions";
const userEmail = "glenn@mail.com";
const newPassword = "Password123!"; // Change this to your desired password

async function resetPassword() {
  try {
    // Get tenant ID from slug
    const mainDb = getMainDb();
    const [tenant] = await mainDb
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      console.error("❌ Tenant not found!");
      process.exit(1);
    }

    console.log("✅ Found tenant:", tenant.name);
    console.log("📝 Tenant ID:", tenant.id);

    // Get tenant database and find user
    const tenantDb = getTenantDb(tenant.id);
    const [user] = await tenantDb
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!user) {
      console.error("❌ User not found!");
      process.exit(1);
    }

    console.log("✅ Found user:", user.email);

    // Hash new password and update user
    const hashedPassword = await hashPassword(newPassword);
    await tenantDb
      .update(users)
      .set({
        passwordHash: hashedPassword,
        otpHash: null,
        otpExpiresAt: null,
        requirePasswordChange: false,
      })
      .where(eq(users.id, user.id));

    console.log("\n✅ Password reset successfully!");
    console.log("🔐 New password:", newPassword);
    console.log("\n📧 Login credentials:");
    console.log("   Tenant Slug:", tenantSlug);
    console.log("   Email:", userEmail);
    console.log("   Password:", newPassword);
    console.log("\n⚠️  Please change this password after logging in!");
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    process.exit(1);
  }
}

resetPassword();
