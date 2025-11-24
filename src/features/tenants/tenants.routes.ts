import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { TenantsController } from "./tenants.controller";

const router = Router();
const tenantsController = new TenantsController();

/**
 * @swagger
 * /api/tenants/register:
 *   post:
 *     tags: [Tenants]
 *     summary: Register new tenant (public)
 *     description: Create a new tenant with admin user - no authentication required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - tenantName
 *               - tenantSlug
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: securePassword123
 *               tenantName:
 *                 type: string
 *                 example: Acme Corp
 *               tenantSlug:
 *                 type: string
 *                 example: acme-corp
 *     responses:
 *       201:
 *         description: Tenant and admin user created successfully
 *       400:
 *         description: Validation error or slug already exists
 */
router.post("/register", tenantsController.registerTenant);

// All other tenant management routes require SuperAdmin authentication
router.use(authenticate, authorize("SuperAdmin"));

/**
 * @swagger
 * /api/tenants/plans:
 *   get:
 *     tags: [Tenants]
 *     summary: Get subscription plans
 *     description: Retrieve all available subscription plans (SuperAdmin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *       403:
 *         description: Not authorized (SuperAdmin only)
 */
router.get("/plans", tenantsController.getSubscriptionPlans);

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     tags: [Tenants]
 *     summary: Get all tenants
 *     description: Retrieve all tenants in the system (SuperAdmin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       subdomain:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       subscriptionPlan:
 *                         type: string
 *                       subscriptionStatus:
 *                         type: string
 *       403:
 *         description: Not authorized (SuperAdmin only)
 */
router.get("/", tenantsController.getAllTenants);

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     tags: [Tenants]
 *     summary: Get tenant by ID
 *     description: Retrieve a specific tenant by ID (SuperAdmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant details
 *       404:
 *         description: Tenant not found
 *       403:
 *         description: Not authorized (SuperAdmin only)
 */
router.get("/:id", tenantsController.getTenantById);

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     tags: [Tenants]
 *     summary: Create tenant
 *     description: Create a new tenant with database initialization (SuperAdmin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subdomain
 *               - subscriptionPlan
 *             properties:
 *               name:
 *                 type: string
 *                 example: ABC Corporation
 *               subdomain:
 *                 type: string
 *                 example: abc-corp
 *                 description: Unique subdomain identifier
 *               subscriptionPlan:
 *                 type: string
 *                 example: professional
 *               subscriptionStatus:
 *                 type: string
 *                 enum: [active, trial, expired, cancelled]
 *                 default: trial
 *               maxUsers:
 *                 type: integer
 *                 example: 50
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *       400:
 *         description: Validation error or subdomain already exists
 *       403:
 *         description: Not authorized (SuperAdmin only)
 */
router.post("/", tenantsController.createTenant);

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     tags: [Tenants]
 *     summary: Update tenant
 *     description: Update an existing tenant (SuperAdmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               subscriptionPlan:
 *                 type: string
 *               maxUsers:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       404:
 *         description: Tenant not found
 *       403:
 *         description: Not authorized (SuperAdmin only)
 */
router.put("/:id", tenantsController.updateTenant);

/**
 * @swagger
 * /api/tenants/{id}:
 *   delete:
 *     tags: [Tenants]
 *     summary: Delete tenant
 *     description: Delete a tenant and all associated data (SuperAdmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *       404:
 *         description: Tenant not found
 *       403:
 *         description: Not authorized (SuperAdmin only)
 */
router.delete("/:id", tenantsController.deleteTenant);

/**
 * @swagger
 * /api/tenants/{id}/subscription:
 *   patch:
 *     tags: [Tenants]
 *     summary: Update tenant subscription
 *     description: Update a tenant's subscription plan and status (SuperAdmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriptionPlan:
 *                 type: string
 *                 example: enterprise
 *               subscriptionStatus:
 *                 type: string
 *                 enum: [active, trial, expired, cancelled]
 *               subscriptionStart:
 *                 type: string
 *                 format: date-time
 *               subscriptionEnd:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       404:
 *         description: Tenant not found
 *       403:
 *         description: Not authorized (SuperAdmin only)
 */
router.patch("/:id/subscription", tenantsController.updateSubscription);

/**
 * @swagger
 * /api/tenants/{id}/suspend:
 *   patch:
 *     tags: [Tenants]
 *     summary: Suspend tenant
 *     description: Suspend a tenant account (SuperAdmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant suspended successfully
 *       404:
 *         description: Tenant not found
 *       403:
 *         description: Not authorized (SuperAdmin only)
 */
router.patch("/:id/suspend", tenantsController.suspendTenant);

/**
 * @swagger
 * /api/tenants/{id}/activate:
 *   patch:
 *     tags: [Tenants]
 *     summary: Activate tenant
 *     description: Activate a suspended tenant account (SuperAdmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant activated successfully
 *       404:
 *         description: Tenant not found
 *       403:
 *         description: Not authorized (SuperAdmin only)
 */
router.patch("/:id/activate", tenantsController.activateTenant);

export default router;
