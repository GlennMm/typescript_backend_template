import { beforeAll, describe, expect, test } from "bun:test";
import request from "supertest";
import app from "../app";
import { getMainDb } from "../db/connection";
import { subscriptionPlans } from "../db/schemas/main.schema";

describe("Tenants E2E Tests", () => {
  let superAdminToken: string;
  let testPlanId: string;

  beforeAll(async () => {
    // Login as super admin
    const loginResponse = await request(app)
      .post("/api/auth/admin/login")
      .send({
        email: "admin@saas.com",
        password: "SuperAdmin123!",
      });

    superAdminToken = loginResponse.body.data.accessToken;

    // Get a subscription plan ID
    const db = getMainDb();
    const [plan] = await db.select().from(subscriptionPlans).limit(1);
    testPlanId = plan.id;
  });

  describe("GET /api/tenants/plans", () => {
    test("should get subscription plans", async () => {
      const response = await request(app)
        .get("/api/tenants/plans")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test("should fail without authentication", async () => {
      const response = await request(app).get("/api/tenants/plans");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("POST /api/tenants", () => {
    test("should create tenant successfully", async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post("/api/tenants")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "Test Company",
          slug: `test-company-${timestamp}`,
          subscriptionPlanId: testPlanId,
          adminEmail: `admin${timestamp}@testcompany.com`,
          adminPassword: "AdminPassword123!",
          adminName: "Test Admin",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Test Company");
      expect(response.body.data.subscriptionStatus).toBe("active");
    });

    test("should fail with duplicate slug", async () => {
      const timestamp = Date.now();
      const slug = `duplicate-slug-${timestamp}`;

      // Create first tenant
      await request(app)
        .post("/api/tenants")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "First Company",
          slug,
          subscriptionPlanId: testPlanId,
          adminEmail: `admin1${timestamp}@testcompany.com`,
          adminPassword: "AdminPassword123!",
          adminName: "Test Admin 1",
        });

      // Try to create second tenant with same slug
      const response = await request(app)
        .post("/api/tenants")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "Second Company",
          slug,
          subscriptionPlanId: testPlanId,
          adminEmail: `admin2${timestamp}@testcompany.com`,
          adminPassword: "AdminPassword123!",
          adminName: "Test Admin 2",
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test("should fail without super admin role", async () => {
      const response = await request(app).post("/api/tenants").send({
        name: "Test Company",
        slug: "test-company",
        subscriptionPlanId: testPlanId,
        adminEmail: "admin@testcompany.com",
        adminPassword: "AdminPassword123!",
        adminName: "Test Admin",
      });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/tenants", () => {
    test("should get all tenants", async () => {
      const response = await request(app)
        .get("/api/tenants")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
