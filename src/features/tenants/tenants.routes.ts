import { Router } from 'express';
import { TenantsController } from './tenants.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const tenantsController = new TenantsController();

// All tenant management routes require SuperAdmin authentication
router.use(authenticate, authorize('SuperAdmin'));

// Subscription plans
router.get('/plans', tenantsController.getSubscriptionPlans);

// Tenant CRUD
router.get('/', tenantsController.getAllTenants);
router.get('/:id', tenantsController.getTenantById);
router.post('/', tenantsController.createTenant);
router.put('/:id', tenantsController.updateTenant);
router.delete('/:id', tenantsController.deleteTenant);

// Subscription management
router.patch('/:id/subscription', tenantsController.updateSubscription);

// Tenant activation/suspension
router.patch('/:id/suspend', tenantsController.suspendTenant);
router.patch('/:id/activate', tenantsController.activateTenant);

export default router;
