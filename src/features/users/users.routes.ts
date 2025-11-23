import { Router } from 'express';
import { UsersController } from './users.controller';
import { resolveTenant } from '../../middleware/tenant';
import { authenticate, authorize, ensureTenantUser } from '../../middleware/auth';
import { checkSubscription } from '../../middleware/subscription';

const router = Router();
const usersController = new UsersController();

// All user routes require authentication, tenant context, and subscription check
router.use(resolveTenant, checkSubscription, authenticate, ensureTenantUser);

// Get current user profile
router.get('/me', usersController.getProfile);

// CRUD operations (TenantAdmin only)
router.get('/', authorize('TenantAdmin'), usersController.getAllUsers);
router.get('/:id', authorize('TenantAdmin'), usersController.getUserById);
router.post('/', authorize('TenantAdmin'), usersController.createUser);
router.put('/:id', authorize('TenantAdmin'), usersController.updateUser);
router.delete('/:id', authorize('TenantAdmin'), usersController.deleteUser);

// User activation (TenantAdmin only)
router.patch('/:id/activate', authorize('TenantAdmin'), usersController.activateUser);

export default router;
