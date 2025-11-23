import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import app from '../app';
import { getMainDb, createTenantDb } from '../db/connection';
import { tenants, subscriptionPlans } from '../db/schemas/main.schema';
import { nanoid } from 'nanoid';

describe('Auth E2E Tests', () => {
  let testTenantId: string;
  let testPlanId: string;

  beforeAll(async () => {
    const db = getMainDb();

    // Create a test subscription plan
    const [plan] = await db.select().from(subscriptionPlans).limit(1);
    testPlanId = plan.id;

    // Create a test tenant
    testTenantId = nanoid();
    await db.insert(tenants).values({
      id: testTenantId,
      name: 'Test Tenant',
      slug: 'test-tenant-' + Date.now(),
      subscriptionPlanId: testPlanId,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      dbPath: `./data/tenants/${testTenantId}.db`,
      isActive: true,
    });

    // Create and migrate tenant database
    createTenantDb(testTenantId);
  });

  describe('POST /api/auth/admin/login', () => {
    test('should login super admin successfully', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'admin@saas.com',
          password: 'SuperAdmin123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe('admin@saas.com');
      expect(response.body.data.user.role).toBe('SuperAdmin');
    });

    test('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'admin@saas.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'admin@saas.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh access token successfully', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'admin@saas.com',
          password: 'SuperAdmin123!',
        });

      const { refreshToken } = loginResponse.body.data;

      // Then refresh
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    test('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid.refresh.token',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register tenant user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('X-Tenant-ID', testTenantId)
        .send({
          email: `testuser${Date.now()}@example.com`,
          password: 'TestPassword123!',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBeDefined();
      expect(response.body.data.role).toBe('TenantUser');
      expect(response.body.data.isActive).toBe(false); // Should require activation
    });

    test('should fail without tenant header', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'TestPassword123!',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('TENANT_ID_MISSING');
    });

    test('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('X-Tenant-ID', testTenantId)
        .send({
          email: 'testuser@example.com',
          password: 'weak',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
