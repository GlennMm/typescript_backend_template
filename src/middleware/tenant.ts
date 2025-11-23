import { Response, NextFunction } from 'express';
import { getMainDb } from '../db/connection';
import { tenants, subscriptionPlans } from '../db/schemas/main.schema';
import { eq } from 'drizzle-orm';
import { errorResponse } from '../utils/response';
import { AuthRequest, TenantContext } from '../types';

export async function resolveTenant(req: AuthRequest, res: Response, next: NextFunction) {
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return errorResponse(res, 'Tenant ID is required', 400, 'TENANT_ID_MISSING');
  }

  try {
    const db = getMainDb();

    const [tenant] = await db
      .select({
        id: tenants.id,
        isActive: tenants.isActive,
        subscriptionStatus: tenants.subscriptionStatus,
        subscriptionPlanId: tenants.subscriptionPlanId,
        planName: subscriptionPlans.name,
        maxUsers: subscriptionPlans.maxUsers,
      })
      .from(tenants)
      .leftJoin(subscriptionPlans, eq(tenants.subscriptionPlanId, subscriptionPlans.id))
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return errorResponse(res, 'Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    if (!tenant.isActive) {
      return errorResponse(res, 'Tenant is inactive', 403, 'TENANT_INACTIVE');
    }

    req.tenant = {
      tenantId: tenant.id,
      isActive: tenant.isActive,
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionPlan: tenant.planName,
      maxUsers: tenant.maxUsers,
    } as TenantContext;

    next();
  } catch (error) {
    return errorResponse(res, 'Failed to resolve tenant', 500, 'TENANT_RESOLUTION_FAILED');
  }
}
