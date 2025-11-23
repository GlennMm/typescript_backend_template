import { Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

export function checkSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return errorResponse(res, 'Tenant context required', 400, 'TENANT_CONTEXT_MISSING');
  }

  const { subscriptionStatus } = req.tenant;

  // Allow access if subscription is active
  if (subscriptionStatus === 'active') {
    return next();
  }

  // If in grace period, allow access but include a warning header
  if (subscriptionStatus === 'grace_period') {
    res.setHeader('X-Subscription-Warning', 'Your subscription is in grace period. Please renew to avoid service disruption.');
    return next();
  }

  // Block access if subscription is inactive or suspended
  if (subscriptionStatus === 'inactive' || subscriptionStatus === 'suspended') {
    return errorResponse(
      res,
      'Service unavailable. Your subscription is not active. Please contact support to reactivate.',
      403,
      'SUBSCRIPTION_INACTIVE'
    );
  }

  next();
}
