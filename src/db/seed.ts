import { nanoid } from "nanoid";
import { hashPassword } from "../utils/password";
import { getMainDb } from "./connection";
import { subscriptionPlans, superAdmins } from "./schemas/main.schema";

async function seed() {
  console.log("🌱 Seeding database...");

  const db = getMainDb();

  // Seed subscription plans
  console.log("📦 Creating subscription plans...");
  const plans = [
    {
      id: nanoid(),
      name: "Free" as const,
      maxUsers: 5,
      features: ["Basic support", "Up to 5 users", "Basic analytics"],
    },
    {
      id: nanoid(),
      name: "Pro" as const,
      maxUsers: 50,
      features: [
        "Priority support",
        "Up to 50 users",
        "Advanced analytics",
        "API access",
      ],
    },
    {
      id: nanoid(),
      name: "Enterprise" as const,
      maxUsers: -1, // Unlimited
      features: [
        "24/7 support",
        "Unlimited users",
        "Advanced analytics",
        "API access",
        "Custom integrations",
        "SLA",
      ],
    },
  ];

  for (const plan of plans) {
    await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
  }
  console.log("✅ Subscription plans created");

  // Create a default super admin
  console.log("👤 Creating super admin...");
  const superAdminPassword = "SuperAdmin123!";
  const hashedPassword = await hashPassword(superAdminPassword);

  await db
    .insert(superAdmins)
    .values({
      id: nanoid(),
      email: "admin@saas.com",
      passwordHash: hashedPassword,
      name: "Super Admin",
      isActive: true,
    })
    .onConflictDoNothing();

  console.log("✅ Super admin created");
  console.log("📧 Email: admin@saas.com");
  console.log("🔑 Password: SuperAdmin123!");
  console.log("⚠️  Please change the password after first login!");

  console.log("✅ Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
