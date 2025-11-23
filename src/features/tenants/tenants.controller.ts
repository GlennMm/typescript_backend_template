import { Response, NextFunction } from 'express';
import { TenantsService } from './tenants.service';
import { createTenantSchema, updateTenantSchema, updateSubscriptionSchema } from './tenants.validation';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../types';

export class TenantsController {
  private tenantsService: TenantsService;

  constructor() {
    this.tenantsService = new TenantsService();
  }

  getAllTenants = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenants = await this.tenantsService.getAllTenants();
      return successResponse(res, tenants);
    } catch (error: any) {
      next(error);
    }
  };

  getTenantById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenant = await this.tenantsService.getTenantById(id);
      return successResponse(res, tenant);
    } catch (error: any) {
      next(error);
    }
  };

  createTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = createTenantSchema.parse(req.body);
      const tenant = await this.tenantsService.createTenant(dto);
      return successResponse(res, tenant, 201);
    } catch (error: any) {
      next(error);
    }
  };

  updateTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto = updateTenantSchema.parse(req.body);
      const tenant = await this.tenantsService.updateTenant(id, dto);
      return successResponse(res, tenant);
    } catch (error: any) {
      next(error);
    }
  };

  updateSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto = updateSubscriptionSchema.parse(req.body);
      const tenant = await this.tenantsService.updateSubscription(id, dto);
      return successResponse(res, tenant);
    } catch (error: any) {
      next(error);
    }
  };

  suspendTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenant = await this.tenantsService.suspendTenant(id);
      return successResponse(res, tenant);
    } catch (error: any) {
      next(error);
    }
  };

  activateTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenant = await this.tenantsService.activateTenant(id);
      return successResponse(res, tenant);
    } catch (error: any) {
      next(error);
    }
  };

  deleteTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.tenantsService.deleteTenant(id);
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  getSubscriptionPlans = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const plans = await this.tenantsService.getSubscriptionPlans();
      return successResponse(res, plans);
    } catch (error: any) {
      next(error);
    }
  };
}
